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

/** Reads the current balance from Supabase, applies delta, writes back. Returns new balance. */
const adjustBalanceInSupabase = async (delta: number): Promise<number | null> => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await (supabase as any)
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();
    if (!data) return null;
    const newBalance = Math.max(0, Number(data.balance) + delta);
    await (supabase as any).from('profiles').update({ balance: newBalance }).eq('id', user.id);
    return newBalance;
  } catch (err) {
    console.error('Failed to adjust balance in Supabase:', err);
    return null;
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
      balance: 0,
      positions: [],
      transactions: [
        {
          id: Math.random().toString(36).substring(7),
          type: 'deposit',
          amount: 10000,
          date: new Date().toISOString(),
          description: 'Initial Deposit',
        },
      ],

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

      deposit: (amount) => {
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          description: 'Deposit',
        };
        // Reads fresh balance from Supabase, adds amount, writes back.
        // This prevents overwriting the real balance with stale local state.
        adjustBalanceInSupabase(amount).then((newBalance) => {
          if (newBalance !== null) {
            set((state) => ({
              balance: newBalance,
              transactions: [transaction, ...state.transactions],
            }));
          }
        });
      },

      withdraw: (amount) => {
        const transaction: Transaction = {
          id: Math.random().toString(36).substring(7),
          type: 'withdrawal',
          amount: -amount,
          date: new Date().toISOString(),
          description: 'Withdrawal',
        };
        // Reads fresh balance from Supabase, subtracts amount, writes back.
        adjustBalanceInSupabase(-amount).then((newBalance) => {
          if (newBalance !== null) {
            set((state) => ({
              balance: newBalance,
              transactions: [transaction, ...state.transactions],
            }));
          }
        });
      },

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
      name: 'nexotrading-storage',
      // Only persist positions and transactions, NOT balance.
      // Balance always comes from Supabase on login so admin changes are reflected immediately.
      partialize: (state) => ({
        positions: state.positions,
        transactions: state.transactions,
      }),
    }
  )
);
