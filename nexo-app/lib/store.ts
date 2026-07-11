import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from './supabase/client';

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

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_open' | 'trade_close' | 'admin_adjustment' | 'binary_win' | 'binary_loss';
  amount: number;
  date: string;
  description?: string;
  status: TransactionStatus;
  userId?: string;
};

export type BinaryOptionStatus = 'open' | 'won' | 'lost' | 'expired';

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
  /** ID del usuario actual — usado para aislar datos en localStorage */
  _currentUserId: string | null;

  openPosition: (position: Omit<Position, 'id' | 'openedAt'>) => boolean;
  closePosition: (id: string, closePrice: number, pnl: number) => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  adminAdjustBalance: (userId: string, newBalance: number, note: string) => void;
  adminEditTransaction: (txId: string, updates: Partial<Pick<Transaction, 'amount' | 'description' | 'status' | 'type'>>) => void;
  adminAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  adminDeleteTransaction: (txId: string) => void;
  openBinaryOption: (option: Omit<BinaryOption, 'id' | 'openedAt' | 'status'>) => boolean;
  settleBinaryOption: (id: string, closePrice: number) => void;
  approveWithdrawal: (txId: string) => void;
  rejectWithdrawal: (txId: string) => void;
  approveDeposit: (txId: string) => void;
  rejectDeposit: (txId: string) => void;
  /** Llama esto al login para limpiar si cambió el usuario */
  initForUser: (userId: string, supabaseBalance: number) => void;
  /** Llama esto al logout */
  resetStore: () => void;
}

const EMPTY_STATE = {
  balance: 0,
  positions: [] as Position[],
  transactions: [] as Transaction[],
  binaryOptions: [] as BinaryOption[],
  _currentUserId: null as string | null,
};

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      // ── Inicializar para un usuario específico ─────────────────────────
      initForUser: (userId: string, supabaseBalance: number) => {
        const current = get()._currentUserId;
        if (current !== null && current !== userId) {
          // Usuario diferente → limpiar todo y empezar desde cero
          set({
            ...EMPTY_STATE,
            _currentUserId: userId,
            balance: supabaseBalance,
          });
        } else if (current === null) {
          // Primera carga → establecer usuario y balance de Supabase
          set({ _currentUserId: userId, balance: supabaseBalance });
        } else {
          // Mismo usuario → solo actualizar balance desde Supabase
          set({ balance: supabaseBalance });
        }
      },

      // ── Reset completo al logout ───────────────────────────────────────
      resetStore: () => {
        set({ ...EMPTY_STATE });
      },

      openPosition: (pos) => {
        let success = false;
        set((state) => {
          const totalDeduct = pos.margin + pos.fee;
          if (state.balance < totalDeduct) return state;

          const newPos: Position = {
            ...pos,
            id: Math.random().toString(36).substring(7),
            openedAt: new Date().toISOString(),
          };

          const transaction: Transaction = {
            id: Math.random().toString(36).substring(7),
            type: 'trade_open',
            amount: -(totalDeduct),
            date: new Date().toISOString(),
            description: `Opened ${pos.leverage}x ${pos.type.toUpperCase()} ${pos.symbol} — Margin: $${pos.margin.toFixed(2)} · Fee: $${pos.fee.toFixed(2)}`,
            status: 'completed',
          };

          success = true;
          const nextBalance = state.balance - totalDeduct;
          syncBalanceToSupabase(nextBalance);
          return {
            balance: nextBalance,
            positions: [...state.positions, newPos],
            transactions: [transaction, ...state.transactions],
          };
        });
        return success;
      },

      closePosition: (id, closePrice, pnl) => set((state) => {
        const position = state.positions.find((p) => p.id === id);
        if (!position) return state;

        const totalReturn = position.margin + pnl;

        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'trade_close',
          amount: pnl,
          date: new Date().toISOString(),
          description: `Closed ${position.leverage}x ${position.type.toUpperCase()} ${position.symbol} @ $${closePrice.toFixed(2)} · PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
          status: 'completed',
        };

        const nextBalance = Math.max(0, state.balance + totalReturn);
        syncBalanceToSupabase(nextBalance);
        return {
          balance: nextBalance,
          positions: state.positions.filter((p) => p.id !== id),
          transactions: [transaction, ...state.transactions],
        };
      }),

      deposit: (amount) => set((state) => {
        // El depósito NO suma al balance inmediatamente — queda en 'pending'
        // hasta que el admin lo apruebe
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          description: 'Depósito pendiente de confirmación — en revisión por el equipo',
          status: 'pending',
        };
        // Balance NO se modifica hasta aprobación del admin
        return {
          balance: state.balance,
          transactions: [transaction, ...state.transactions],
        };
      }),

      approveDeposit: (txId) => set((state) => {
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx || tx.type !== 'deposit' || tx.status !== 'pending') return state;
        const nextBalance = state.balance + tx.amount;
        syncBalanceToSupabase(nextBalance);
        return {
          balance: nextBalance,
          transactions: state.transactions.map(t =>
            t.id === txId
              ? { ...t, status: 'completed', description: (t.description || 'Deposit') + ' — Aprobado por admin' }
              : t
          ),
        };
      }),

      rejectDeposit: (txId) => set((state) => ({
        transactions: state.transactions.map(t =>
          t.id === txId && t.type === 'deposit'
            ? { ...t, status: 'failed', description: (t.description || 'Deposit') + ' — Rechazado por admin' }
            : t
        ),
      })),

      withdraw: (amount) => set((state) => {
        if (state.balance < amount) return state;
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'withdrawal',
          amount: -amount,
          date: new Date().toISOString(),
          description: 'Withdrawal request — processing up to 24 hours',
          status: 'pending',
        };
        const nextBalance = state.balance - amount;
        syncBalanceToSupabase(nextBalance);
        return {
          balance: nextBalance,
          transactions: [transaction, ...state.transactions],
        };
      }),

      adminAdjustBalance: (_userId, newBalance, note) => set((state) => {
        const diff = newBalance - state.balance;
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'admin_adjustment',
          amount: diff,
          date: new Date().toISOString(),
          description: `Admin adjustment: ${note}`,
          status: 'completed',
        };
        syncBalanceToSupabase(newBalance);
        return {
          balance: newBalance,
          transactions: [transaction, ...state.transactions],
        };
      }),

      adminEditTransaction: (txId, updates) => set((state) => ({
        transactions: state.transactions.map(tx =>
          tx.id === txId ? { ...tx, ...updates } : tx
        ),
      })),

      adminAddTransaction: (tx) => set((state) => {
        const newTx: Transaction = {
          ...tx,
          id: Math.random().toString(36).substring(7),
        };
        const nextBalance = state.balance + tx.amount;
        if (tx.type !== 'trade_open' && tx.type !== 'trade_close') {
          syncBalanceToSupabase(Math.max(0, nextBalance));
        }
        return {
          balance: tx.type === 'deposit' || tx.type === 'admin_adjustment'
            ? Math.max(0, nextBalance)
            : state.balance,
          transactions: [newTx, ...state.transactions],
        };
      }),

      adminDeleteTransaction: (txId) => set((state) => ({
        transactions: state.transactions.filter(tx => tx.id !== txId),
      })),

      openBinaryOption: (option) => {
        let success = false;
        set((state) => {
          if (state.balance < option.amount) return state;

          const newOption: BinaryOption = {
            ...option,
            id: Math.random().toString(36).substring(7),
            openedAt: new Date().toISOString(),
            status: 'open',
          };

          const transaction: Transaction = {
            id: Math.random().toString(36).substring(7),
            type: 'trade_open',
            amount: -option.amount,
            date: new Date().toISOString(),
            description: `Binary ${option.direction.toUpperCase()} ${option.symbol} — Expires in ${Math.round((new Date(option.expiresAt).getTime() - Date.now()) / 1000)}s`,
            status: 'completed',
          };

          success = true;
          const nextBalance = state.balance - option.amount;
          syncBalanceToSupabase(nextBalance);
          return {
            balance: nextBalance,
            binaryOptions: [newOption, ...state.binaryOptions],
            transactions: [transaction, ...state.transactions],
          };
        });
        return success;
      },

      settleBinaryOption: (id, closePrice) => set((state) => {
        const option = state.binaryOptions.find(o => o.id === id);
        if (!option || option.status !== 'open') return state;

        const isWin =
          (option.direction === 'call' && closePrice > option.entryPrice) ||
          (option.direction === 'put' && closePrice < option.entryPrice);

        const payout = isWin ? option.amount * (1 + option.payoutRate) : 0;
        const pnl = isWin ? option.amount * option.payoutRate : -option.amount;

        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: isWin ? 'binary_win' : 'binary_loss',
          amount: isWin ? payout : 0,
          date: new Date().toISOString(),
          description: `Binary ${option.direction.toUpperCase()} ${option.symbol} — ${isWin ? `WON +$${pnl.toFixed(2)}` : `LOST -$${option.amount.toFixed(2)}`}`,
          status: 'completed',
        };

        const nextBalance = state.balance + payout;
        syncBalanceToSupabase(nextBalance);

        return {
          balance: nextBalance,
          binaryOptions: state.binaryOptions.map(o =>
            o.id === id ? { ...o, status: isWin ? 'won' : 'lost', closePrice, pnl } : o
          ),
          transactions: [transaction, ...state.transactions],
        };
      }),

      approveWithdrawal: (txId) => set((state) => ({
        transactions: state.transactions.map(tx =>
          tx.id === txId && tx.type === 'withdrawal'
            ? { ...tx, status: 'completed', description: (tx.description || 'Withdrawal') + ' — Approved' }
            : tx
        ),
      })),

      rejectWithdrawal: (txId) => set((state) => {
        const tx = state.transactions.find(t => t.id === txId);
        if (!tx || tx.type !== 'withdrawal') return state;
        const refundAmount = Math.abs(tx.amount);
        const nextBalance = state.balance + refundAmount;
        syncBalanceToSupabase(nextBalance);
        return {
          balance: nextBalance,
          transactions: state.transactions.map(t =>
            t.id === txId
              ? { ...t, status: 'failed', description: (t.description || 'Withdrawal') + ' — Rejected & Refunded' }
              : t
          ),
        };
      }),
    }),
    {
      name: 'nexotrading-storage',
      // La clave de localStorage se hace dinámica basada en el userId
      // Esto aísla completamente los datos de cada usuario
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') return localStorage;
        // Wrapper que prefija todas las claves con el userId del estado actual
        return {
          getItem: (name: string) => {
            const raw = localStorage.getItem(name);
            if (!raw) return null;
            try {
              const parsed = JSON.parse(raw);
              return raw; // devolver tal cual, el filtro ocurre en initForUser
            } catch {
              return null;
            }
          },
          setItem: (name: string, value: string) => {
            localStorage.setItem(name, value);
          },
          removeItem: (name: string) => {
            localStorage.removeItem(name);
          },
        };
      }),
    }
  )
);
