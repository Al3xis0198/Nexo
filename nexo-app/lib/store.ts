import { create } from 'zustand';
import { createClient } from './supabase/client';
import type { PositionStatus, TransactionStatus, BinaryOptionStatus, TransactionType } from './supabase/types';
import { toast } from 'sonner';

/** Writes an absolute balance value to Supabase */
const syncBalanceToSupabase = async (newBalance: number) => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await (supabase as any).from('profiles').update({ balance: newBalance }).eq('id', user.id);
    }
  } catch (err) {
    console.error('Failed to sync balance to Supabase:', err);
  }
};

export type Position = {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  margin: number;
  fee: number;
  entryPrice: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  status: TransactionStatus;
  userId?: string;
};

export type { TransactionStatus };

export type BinaryOption = {
  id: string;
  symbol: string;
  direction: 'call' | 'put';
  amount: number;
  payoutRate: number;
  entryPrice: number;
  expiresAt: string;
  openedAt: string;
  status: BinaryOptionStatus;
  closePrice?: number;
  pnl?: number;
};

interface TradingState {
  balance: number;
  positions: Position[];
  transactions: Transaction[];
  binaryOptions: BinaryOption[];
  _currentUserId: string | null;
  loadingData: boolean;
  platformConfig: {
    fee: number;
    maxLeverage: number;
  };

  openPosition: (position: Omit<Position, 'id' | 'openedAt'>) => Promise<boolean>;
  closePosition: (id: string, closePrice: number, pnl: number) => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  adminAdjustBalance: (userId: string, newBalance: number, note: string) => Promise<void>;
  adminEditTransaction: (txId: string, updates: Partial<Pick<Transaction, 'amount' | 'description' | 'status' | 'type'>>) => Promise<void>;
  adminAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  adminDeleteTransaction: (txId: string) => Promise<void>;
  openBinaryOption: (option: Omit<BinaryOption, 'id' | 'openedAt' | 'status'>) => Promise<boolean>;
  settleBinaryOption: (id: string, closePrice: number) => Promise<void>;
  approveWithdrawal: (txId: string) => Promise<void>;
  rejectWithdrawal: (txId: string) => Promise<void>;
  approveDeposit: (txId: string) => Promise<void>;
  rejectDeposit: (txId: string) => Promise<void>;
  
  initForUser: (userId: string, supabaseBalance: number) => Promise<void>;
  resetStore: () => void;
  updatePlatformConfig: (fee: number, maxLeverage: number) => Promise<boolean>;
}

const EMPTY_STATE = {
  balance: 0,
  positions: [] as Position[],
  transactions: [] as Transaction[],
  binaryOptions: [] as BinaryOption[],
  _currentUserId: null as string | null,
  loadingData: false,
  platformConfig: {
    fee: 0.1,
    maxLeverage: 100,
  },
};

export const useTradingStore = create<TradingState>()(
  (set, get) => ({
    ...EMPTY_STATE,

    initForUser: async (userId: string, supabaseBalance: number) => {
      set({ loadingData: true, _currentUserId: userId, balance: supabaseBalance });
      const supabase = createClient();
      
      try {
        const posRes: any = await supabase.from('positions').select('*').eq('user_id', userId).eq('status', 'open').order('opened_at', { ascending: false });
        const txRes: any = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
        const binRes: any = await supabase.from('binary_options').select('*').eq('user_id', userId).order('opened_at', { ascending: false }).limit(50);
        const cfgRes: any = await supabase.from('platform_settings').select('*').single();

        let cfg = { fee: 0.1, maxLeverage: 100 };
        if (cfgRes.data) {
          cfg = { fee: Number(cfgRes.data.fee), maxLeverage: Number(cfgRes.data.max_leverage) };
        }

        const positions: Position[] = (posRes.data || []).map((p: any) => ({
          id: p.id,
          symbol: p.symbol,
          type: p.type as 'buy'|'sell',
          amount: p.amount,
          margin: p.amount / p.leverage, // Estimación simple
          fee: 0, // No está en BD
          entryPrice: p.entry_price,
          leverage: p.leverage,
          openedAt: p.opened_at,
        }));

        const transactions: Transaction[] = (txRes.data || []).map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          date: t.created_at,
          description: t.description || undefined,
          status: t.status as TransactionStatus,
          userId: t.user_id,
        }));

        const binaryOptions: BinaryOption[] = (binRes.data || []).map((b: any) => ({
          id: b.id,
          symbol: b.symbol,
          direction: b.direction as 'call'|'put',
          amount: Number(b.amount),
          payoutRate: Number(b.payout_rate),
          entryPrice: Number(b.entry_price),
          expiresAt: b.expires_at,
          openedAt: b.opened_at,
          status: b.status as BinaryOptionStatus,
          closePrice: b.close_price || undefined,
          pnl: b.pnl || undefined,
        }));

        set({ positions, transactions, binaryOptions, platformConfig: cfg });
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        set({ loadingData: false });
      }
    },

    resetStore: () => {
      set({ ...EMPTY_STATE, platformConfig: get().platformConfig });
    },

    updatePlatformConfig: async (fee, maxLeverage) => {
      const supabase = createClient();
      try {
        const { error } = await (supabase as any).from('platform_settings').upsert({ id: 1, fee, max_leverage: maxLeverage });
        if (error) throw error;
        set({ platformConfig: { fee, maxLeverage } });
        return true;
      } catch (err) {
        console.error('Failed to update config:', err);
        return false;
      }
    },

    openPosition: async (pos) => {
      const state = get();
      const totalDeduct = pos.margin + pos.fee;
      if (state.balance < totalDeduct || !state._currentUserId) return false;

      const nextBalance = state.balance - totalDeduct;
      const supabase = createClient();
      
      const posInsert = {
        user_id: state._currentUserId,
        symbol: pos.symbol,
        type: pos.type,
        asset_type: 'crypto', // Default
        amount: pos.amount,
        entry_price: pos.entryPrice,
        leverage: pos.leverage,
        status: 'open',
      };

      const txInsert = {
        user_id: state._currentUserId,
        type: 'trade_open',
        amount: -totalDeduct,
        description: `Opened ${pos.leverage}x ${pos.type.toUpperCase()} ${pos.symbol} — Margin: $${pos.margin.toFixed(2)}`,
        status: 'completed',
      };

      try {
        const posData: any = await supabase.from('positions').insert(posInsert as any).select().single();
        const txData: any = await supabase.from('transactions').insert(txInsert as any).select().single();
        await syncBalanceToSupabase(nextBalance);

        if (posData.data && txData.data) {
          const newPos: Position = { ...pos, id: posData.data.id, openedAt: posData.data.opened_at };
          const newTx: Transaction = { id: txData.data.id, type: 'trade_open', amount: txData.data.amount, date: txData.data.created_at, description: txData.data.description, status: 'completed' };
          
          set({ balance: nextBalance, positions: [newPos, ...state.positions], transactions: [newTx, ...state.transactions] });
          return true;
        }
      } catch (err) {
        console.error('openPosition err', err);
      }
      return false;
    },

    closePosition: async (id, closePrice, pnl) => {
      const state = get();
      const position = state.positions.find((p) => p.id === id);
      if (!position || !state._currentUserId) return;

      const totalReturn = position.margin + pnl;
      const nextBalance = Math.max(0, state.balance + totalReturn);
      const supabase = createClient();

      const txInsert = {
        user_id: state._currentUserId,
        type: 'trade_close',
        amount: pnl,
        description: `Closed ${position.leverage}x ${position.type.toUpperCase()} ${position.symbol} @ $${closePrice.toFixed(2)} · PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        status: 'completed',
      };

      try {
        await Promise.all([
          (supabase as any).from('positions').update({ status: 'closed', close_price: closePrice, fixed_pnl: pnl, closed_at: new Date().toISOString() }).eq('id', id),
          (supabase as any).from('transactions').insert(txInsert as any),
          syncBalanceToSupabase(nextBalance)
        ]);

        set({ balance: nextBalance, positions: state.positions.filter(p => p.id !== id) });
        // Recargar las transacciones podría ser mejor, pero por optimismo inyectamos una local simulada
        const optimisticTx: Transaction = { id: Math.random().toString(36).substring(7), type: 'trade_close', amount: pnl, date: new Date().toISOString(), description: txInsert.description, status: 'completed' };
        set({ transactions: [optimisticTx, ...state.transactions] });
      } catch (err) {
        console.error(err);
      }
    },

    deposit: async (amount) => {
      const state = get();
      if (!state._currentUserId) return;
      const supabase = createClient();
      
      const txInsert = {
        user_id: state._currentUserId,
        type: 'deposit',
        amount: amount,
        description: 'Depósito pendiente de confirmación — en revisión por el equipo',
        status: 'pending',
      };

      try {
        const { data }: any = await supabase.from('transactions').insert(txInsert as any).select().single();
        if (data) {
          const newTx: Transaction = { id: data.id, type: 'deposit', amount: data.amount, date: data.created_at, description: data.description, status: 'pending' };
          set({ transactions: [newTx, ...state.transactions] });
        }
      } catch (err) { console.error(err) }
    },

    approveDeposit: async (txId) => {
      const state = get();
      const tx = state.transactions.find(t => t.id === txId);
      if (!tx || tx.type !== 'deposit' || tx.status !== 'pending') return;
      
      const nextBalance = state.balance + tx.amount;
      const supabase = createClient();
      const desc = (tx.description || 'Deposit') + ' — Aprobado por admin';
      
      try {
        await Promise.all([
          (supabase as any).from('transactions').update({ status: 'completed', description: desc }).eq('id', txId),
          (supabase as any).from('profiles').update({ balance: nextBalance }).eq('id', tx.userId || state._currentUserId)
        ]);
        
        set({
          balance: tx.userId ? state.balance : nextBalance, // Solo actualizar balance si estamos viendo nuestra cuenta
          transactions: state.transactions.map(t => t.id === txId ? { ...t, status: 'completed', description: desc } : t)
        });
      } catch (err) { console.error(err) }
    },

    rejectDeposit: async (txId) => {
      const state = get();
      const tx = state.transactions.find(t => t.id === txId);
      const supabase = createClient();
      const desc = (tx?.description || 'Deposit') + ' — Rechazado por admin';
      
      try {
        await (supabase as any).from('transactions').update({ status: 'failed', description: desc }).eq('id', txId);
        set({ transactions: state.transactions.map(t => t.id === txId ? { ...t, status: 'failed', description: desc } : t) });
      } catch (err) { console.error(err) }
    },

    withdraw: async (amount) => {
      const state = get();
      if (!state._currentUserId || state.balance < amount) return;
      const nextBalance = state.balance - amount;
      const supabase = createClient();
      
      const txInsert = {
        user_id: state._currentUserId,
        type: 'withdrawal',
        amount: -amount,
        description: 'Withdrawal request — processing up to 24 hours',
        status: 'pending',
      };

      try {
        const txData: any = await supabase.from('transactions').insert(txInsert as any).select().single();
        await syncBalanceToSupabase(nextBalance);

        if (txData.data) {
          const newTx: Transaction = { id: txData.data.id, type: 'withdrawal', amount: txData.data.amount, date: txData.data.created_at, description: txData.data.description, status: 'pending' };
          set({ balance: nextBalance, transactions: [newTx, ...state.transactions] });
        }
      } catch (err) { console.error(err) }
    },

    adminAdjustBalance: async (userId, newBalance, note) => {
      // Simplificado para la UI admin
    },
    adminEditTransaction: async (txId, updates) => {},
    adminAddTransaction: async (tx) => {},
    adminDeleteTransaction: async (txId) => {},

    openBinaryOption: async (option) => {
      const state = get();
      if (state.balance < option.amount || !state._currentUserId) return false;
      const nextBalance = state.balance - option.amount;
      const supabase = createClient();

      const binInsert = {
        user_id: state._currentUserId,
        symbol: option.symbol,
        direction: option.direction,
        amount: option.amount,
        payout_rate: option.payoutRate,
        entry_price: option.entryPrice,
        status: 'open',
        expires_at: option.expiresAt,
      };

      const txInsert = {
        user_id: state._currentUserId,
        type: 'trade_open',
        amount: -option.amount,
        description: `Binary ${option.direction.toUpperCase()} ${option.symbol}`,
        status: 'completed',
      };

      try {
        const binData: any = await supabase.from('binary_options').insert(binInsert as any).select().single();
        const txData: any = await supabase.from('transactions').insert(txInsert as any).select().single();
        await syncBalanceToSupabase(nextBalance);

        if (binData.data && txData.data) {
          const b = binData.data;
          const newBin: BinaryOption = { id: b.id, symbol: b.symbol, direction: b.direction as any, amount: Number(b.amount), payoutRate: Number(b.payout_rate), entryPrice: Number(b.entry_price), status: 'open', expiresAt: b.expires_at, openedAt: b.opened_at };
          const newTx: Transaction = { id: txData.data.id, type: 'trade_open', amount: txData.data.amount, date: txData.data.created_at, description: txData.data.description, status: 'completed' };
          set({ balance: nextBalance, binaryOptions: [newBin, ...state.binaryOptions], transactions: [newTx, ...state.transactions] });
          return true;
        }
      } catch (err) { console.error(err) }
      return false;
    },

    settleBinaryOption: async (id, closePrice) => {
      const state = get();
      const option = state.binaryOptions.find(o => o.id === id);
      if (!option || option.status !== 'open' || !state._currentUserId) return;

      const isWin = (option.direction === 'call' && closePrice > option.entryPrice) || (option.direction === 'put' && closePrice < option.entryPrice);
      const payout = isWin ? option.amount * (1 + option.payoutRate) : 0;
      const pnl = isWin ? option.amount * option.payoutRate : -option.amount;
      const nextBalance = state.balance + payout;
      const supabase = createClient();
      const status = isWin ? 'won' : 'lost';

      const txInsert = {
        user_id: state._currentUserId,
        type: isWin ? 'binary_win' : 'binary_loss',
        amount: isWin ? payout : 0,
        description: `Binary ${option.direction.toUpperCase()} ${option.symbol} — ${isWin ? `Ganancia: +$${pnl.toFixed(2)} (Pago total: $${payout.toFixed(2)})` : `Pérdida: -$${option.amount.toFixed(2)}`}`,
        status: 'completed',
      };

      // Optimistic lock: update local state immediately to prevent duplicate settlements
      set({
        binaryOptions: state.binaryOptions.map(o => o.id === id ? { ...o, status, closePrice, pnl } : o)
      });

      try {
        await Promise.all([
          (supabase as any).from('binary_options').update({ status, close_price: closePrice, pnl }).eq('id', id),
          (supabase as any).from('transactions').insert(txInsert as any),
          syncBalanceToSupabase(nextBalance)
        ]);

        set({ balance: nextBalance });
        
        const optimisticTx: Transaction = { id: Math.random().toString(36).substring(7), type: txInsert.type as any, amount: txInsert.amount, date: new Date().toISOString(), description: txInsert.description, status: 'completed' };
        set({ transactions: [optimisticTx, ...state.transactions] });
      } catch (err) { console.error(err) }
    },

    approveWithdrawal: async (txId) => {
      const state = get();
      const tx = state.transactions.find(t => t.id === txId);
      const supabase = createClient();
      const desc = (tx?.description || 'Withdrawal') + ' — Approved';
      try {
        await (supabase as any).from('transactions').update({ status: 'completed', description: desc }).eq('id', txId);
        set({ transactions: state.transactions.map(t => t.id === txId ? { ...t, status: 'completed', description: desc } : t) });
      } catch (err) { console.error(err) }
    },

    rejectWithdrawal: async (txId) => {
      const state = get();
      const tx = state.transactions.find(t => t.id === txId);
      if (!tx || tx.type !== 'withdrawal') return;
      const refundAmount = Math.abs(tx.amount);
      const nextBalance = state.balance + refundAmount;
      const supabase = createClient();
      const desc = (tx.description || 'Withdrawal') + ' — Rejected & Refunded';

      try {
        await Promise.all([
          (supabase as any).from('transactions').update({ status: 'failed', description: desc }).eq('id', txId),
          (supabase as any).from('profiles').update({ balance: nextBalance }).eq('id', tx.userId || state._currentUserId)
        ]);
        set({
          balance: tx.userId ? state.balance : nextBalance,
          transactions: state.transactions.map(t => t.id === txId ? { ...t, status: 'failed', description: desc } : t)
        });
      } catch (err) { console.error(err) }
    },

  })
);
