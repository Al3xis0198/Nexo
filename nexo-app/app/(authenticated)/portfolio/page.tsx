"use client";

import React from 'react';
import { useTradingStore } from '@/lib/store';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { PieChart, Activity, TrendingUp, History } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  const balance = useTradingStore(state => state.balance);
  const positions = useTradingStore(state => state.positions);
  const transactions = useTradingStore(state => state.transactions);

  // Mock current prices for PNL calculation
  const getMockPrice = (symbol: string) => {
    if (symbol.includes('BTC')) return 64230.50;
    if (symbol.includes('ETH')) return 3450.20;
    if (symbol.includes('SOL')) return 145.30;
    return 100.00;
  };

  const totalInvested = positions.reduce((acc, pos) => acc + (pos.amount / pos.leverage), 0);
  
  const totalUnrealizedPnl = positions.reduce((acc, pos) => {
    const currentPrice = getMockPrice(pos.symbol);
    const isLong = pos.type === 'buy';
    const priceDiff = isLong ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
    const percentage = priceDiff / pos.entryPrice;
    return acc + (pos.amount * percentage);
  }, 0);

  const estimatedTotal = balance + totalInvested + totalUnrealizedPnl;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-subtitle">Manage your open positions and view history.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:border-[var(--border-focus)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <PieChart size={16} />
            <h3 className="font-medium text-sm uppercase tracking-wider">Est. Total Asset</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-primary">
            {formatCurrency(estimatedTotal)}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-[rgba(43,49,57,0.5)]">
            <div>
              <div className="text-xs text-secondary mb-1">Available Margin</div>
              <div className="font-mono font-medium">{formatCurrency(balance)}</div>
            </div>
            <div>
              <div className="text-xs text-secondary mb-1">Total Invested</div>
              <div className="font-mono font-medium">{formatCurrency(totalInvested)}</div>
            </div>
          </div>
        </div>

        <div className="card hover:border-[var(--border-focus)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Activity size={16} />
            <h3 className="font-medium text-sm uppercase tracking-wider">Unrealized PNL</h3>
          </div>
          <div className={`text-3xl font-bold font-mono ${totalUnrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(43,49,57,0.5)]">
            <div className="text-xs text-secondary mb-1">ROI</div>
            <div className={`font-mono font-medium ${totalUnrealizedPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
              {totalInvested > 0 ? formatPercentage((totalUnrealizedPnl / totalInvested) * 100) : '0.00%'}
            </div>
          </div>
        </div>

        <div className="card hover:border-[var(--border-focus)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <TrendingUp size={16} />
            <h3 className="font-medium text-sm uppercase tracking-wider">Open Positions</h3>
          </div>
          <div className="text-3xl font-bold font-mono text-primary">
            {positions.length}
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(43,49,57,0.5)]">
            <Link href="/markets" className="text-accent text-sm hover:underline">
              Browse Markets →
            </Link>
          </div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="card p-0 overflow-hidden mt-2 hover:border-[var(--border-focus)] transition-all duration-300">
        <div className="p-4 border-b border-border bg-secondary flex justify-between items-center">
          <h3 className="font-semibold">Open Positions</h3>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          {positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(240,185,11,0.1)] flex items-center justify-center mb-4 border border-[rgba(240,185,11,0.2)]">
                <TrendingUp size={28} className="text-accent" />
              </div>
              <h4 className="text-lg font-bold mb-2">No Open Positions</h4>
              <p className="text-secondary max-w-sm mb-6">
                Your portfolio is currently empty. Explore the markets and find your next trading opportunity.
              </p>
              <Link href="/markets" className="btn btn-primary px-6">
                Explore Markets
              </Link>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Type / Lev</th>
                  <th className="text-right">Size</th>
                  <th className="text-right">Entry Price</th>
                  <th className="text-right">Mark Price</th>
                  <th className="text-right">Unrealized PNL</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => {
                  const currentPrice = getMockPrice(pos.symbol);
                  const isLong = pos.type === 'buy';
                  const priceDiff = isLong ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
                  const percentage = priceDiff / pos.entryPrice;
                  const pnl = pos.amount * percentage;
                  const pnlPct = (pnl / (pos.amount / pos.leverage)) * 100;
                  const isPositive = pnl >= 0;

                  return (
                    <tr key={pos.id} className="group">
                      <td>
                        <Link href={`/trade/${pos.symbol.replace('/', '-')}`} className="font-bold hover:text-accent transition-colors">
                          {pos.symbol}
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${pos.type === 'buy' ? 'badge-bull' : 'badge-bear'}`}>
                            {pos.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-secondary">{pos.leverage}x</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">{formatCurrency(pos.amount)}</td>
                      <td className="text-right font-mono text-secondary">{formatCurrency(pos.entryPrice, true)}</td>
                      <td className="text-right font-mono text-primary">{formatCurrency(currentPrice, true)}</td>
                      <td className="text-right">
                        <div className={`font-mono font-bold ${isPositive ? 'text-bull' : 'text-bear'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(pnl)}
                          <div className="text-xs font-normal opacity-80">{isPositive ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                        </div>
                      </td>
                      <td className="text-right">
                        <Link href={`/trade/${pos.symbol.replace('/', '-')}`} className="btn btn-sm btn-ghost">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Closed Trades History */}
      <div className="card p-0 overflow-hidden mt-2 hover:border-[var(--border-focus)] transition-all duration-300">
        <div className="p-4 border-b border-border bg-secondary flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History size={18} className="text-secondary" />
            <h3 className="font-semibold">Transaction History</h3>
          </div>
        </div>
        <div className="table-wrapper border-0 rounded-none">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id}>
                  <td className="text-secondary text-sm">
                    <span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {tx.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="text-sm">{tx.description || '-'}</td>
                  <td className="text-right font-mono font-medium">
                    <span className={tx.amount > 0 ? 'text-bull' : 'text-bear'}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
