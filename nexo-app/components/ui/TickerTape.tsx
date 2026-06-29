/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';

type TickerItem = { symbol: string; price: number; change: number };

const INITIAL_TICKERS: TickerItem[] = [
  { symbol: 'BTC/USD', price: 64230.10, change: 2.45 },
  { symbol: 'ETH/USD', price: 3450.80, change: 1.12 },
  { symbol: 'BNB/USD', price: 590.25, change: -0.5 },
  { symbol: 'SOL/USD', price: 145.30, change: -4.2 },
  { symbol: 'XRP/USD', price: 0.62, change: 0.8 },
  { symbol: 'AAPL',    price: 189.45, change: 1.2 },
  { symbol: 'NVDA',    price: 890.10, change: 4.5 },
  { symbol: 'TSLA',    price: 215.30, change: -2.4 },
  { symbol: 'EUR/USD', price: 1.0854, change: -0.15 },
  { symbol: 'XAU/USD', price: 2345.60, change: 0.85 },
  { symbol: 'WTI/USD', price: 82.50,  change: -1.2 },
];

function fmt(price: number) {
  if (price > 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price > 1)    return price.toFixed(4);
  return price.toFixed(5);
}

export default function TickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/markets');
        if (res.ok) {
          const data = await res.json();
          // Transform API MarketItem to TickerItem
          const apiTickers = data.slice(0, 15).map((m: any) => ({
            symbol: m.symbol.includes('/') ? m.symbol : `${m.symbol}/USD`,
            price: m.price,
            change: m.change24h
          }));
          setTickers(apiTickers);
        }
      } catch (e) {}
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 15000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate to make scroll seamless
  const doubled = [...tickers, ...tickers];

  return (
    <div
      className="ticker-tape shrink-0"
      style={{ height: 34, overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      <div
        className="ticker-content"
        style={{ display: 'flex', gap: 32, whiteSpace: 'nowrap', animation: 'ticker-scroll 50s linear infinite', paddingLeft: 16 }}
      >
        {doubled.map((t, i) => (
          <div key={i} className="ticker-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 500 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t.symbol}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
              ${fmt(t.price)}
            </span>
            <span
              style={{
                color: t.change >= 0 ? 'var(--bull)' : 'var(--bear)',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
