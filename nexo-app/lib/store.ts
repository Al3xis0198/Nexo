import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  amount: number;       // Total notional (margin × leverage)
  margin: number;       // Actual capital deducted from balance
  fee: number;          // Fee paid
  entryPrice: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_open' | 'trade_close' | 'admin_adjustment';
  amount: number;
  date: string;
  description?: string;
};

interface TradingState {
  balance: number;
  positions: Position[];
  transactions: Transaction[];

  openPosition: (position: Omit<Position, 'id' | 'openedAt'>) => boolean;
  closePosition: (id: string, closePrice: number, pnl: number) => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  adminAdjustBalance: (userId: string, newBalance: number, note: string) => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set) => ({
      // Balance IS persisted so deposit/withdraw always operate on the correct value.
      // AuthContext always overrides this with the Supabase value on every login/page load,
      // so admin DB changes are reflected whenever the user refreshes or logs back in.
      balance: 0,
      positions: [],
      transactions: [],

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
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          description: 'Deposit',
        };
        // state.balance here is always correct because AuthContext loads it from
        // Supabase on every login/page load before the user can interact with the wallet.
        const nextBalance = state.balance + amount;
        syncBalanceToSupabase(nextBalance);
        return {
          balance: nextBalance,
          transactions: [transaction, ...state.transactions],
        };
      }),

      withdraw: (amount) => set((state) => {
        if (state.balance < amount) return state;
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'withdrawal',
          amount: -amount,
          date: new Date().toISOString(),
          description: 'Withdrawal',
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
        };
        syncBalanceToSupabase(newBalance);
        return {
          balance: newBalance,
          transactions: [transaction, ...state.transactions],
        };
      }),
    }),
    {
      // Persist everything including balance so deposit/withdraw always have a real base value.
      name: 'nexotrading-storage',
    }
  )
);
