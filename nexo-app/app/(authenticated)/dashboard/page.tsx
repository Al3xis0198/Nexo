'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, TrendingUp, Wallet, BarChart2, RefreshCw, Rocket, Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTradingStore } from '@/lib/store'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { calcFearGreedIndex } from '@/lib/analysis/indicators'
import AssetIcon from '@/components/ui/AssetIcon'

type MarketItem = {
  id: string; symbol: string; name: string; price: number
  change24h: number; change7d: number; volume24h: number; marketCap: number; type: string
  image?: string
}


export default function DashboardPage() {
  const { profile, isDemoMode } = useAuth()
  const balance     = useTradingStore(s => s.balance)
  const positions   = useTradingStore(s => s.positions)
  const transactions = useTradingStore(s => s.transactions)

  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const displayBalance = balance

  // Fetch markets from API route
  const fetchMarkets = async () => {
    try {
      const res = await fetch('/api/markets')
      if (res.ok) {
        const data = await res.json()
        setMarkets(data.slice(0, 50))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarkets()
    }, 0)
    const interval = setInterval(fetchMarkets, 15_000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  // ─── Métricas de mercado ───────────────────────────────────────────────────
  const bullCount  = markets.filter(m => m.change24h > 0).length
  const bearCount  = markets.filter(m => m.change24h < 0).length
  const breadth    = markets.length > 0 ? (bullCount / markets.length) * 100 : 50

  const topGainers = [...markets].sort((a, b) => b.change24h - a.change24h).slice(0, 5)
  const topLosers  = [...markets].sort((a, b) => a.change24h - b.change24h).slice(0, 5)

  const prices = markets.map(m => m.price)
  const fearGreed = calcFearGreedIndex(prices.length > 5 ? prices : [100,101,102,100,99,98,100,103,105,104])

  // ─── PnL de posiciones (precio mock hasta que haya precios reales) ─────────
  const getMockPrice = (sym: string) => {
    const found = markets.find(m => m.symbol === sym.replace('/', '') || m.symbol === sym)
    return found?.price ?? 100
  }

  const unrealisedPnl = positions.reduce((acc, pos) => {
    const cur = getMockPrice(pos.symbol)
    const diff = pos.type === 'buy' ? cur - pos.entryPrice : pos.entryPrice - cur
    return acc + pos.amount * (diff / pos.entryPrice) // amount is notional (margin * leverage)
  }, 0)

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ─── Header ─── */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Real-time market overview · <span suppressHydrationWarning>Updated {lastRefresh.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchMarkets} className="btn btn-ghost flex items-center gap-2">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link href="/trade/BTC-USD" className="btn btn-primary">Trade Now</Link>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Balance', value: formatCurrency(displayBalance), sub: 'Available', icon: Wallet, color: 'var(--accent)', bg: 'var(--accent-dim)', href: '/wallet' },
          { label: 'Positions', value: positions.length, sub: positions.length === 0 ? 'No trades open' : 'Active trades', icon: TrendingUp, color: '#1890FF', bg: 'rgba(24,144,255,0.12)', href: '/portfolio' },
          { label: 'Unrealised PnL', value: (unrealisedPnl >= 0 ? '+' : '') + formatCurrency(unrealisedPnl), sub: 'From positions', icon: Activity, color: unrealisedPnl >= 0 ? 'var(--bull)' : 'var(--bear)', bg: unrealisedPnl >= 0 ? 'var(--bull-dim)' : 'var(--bear-dim)', href: '/portfolio' },
          { label: 'Transactions', value: transactions.length, sub: 'All time', icon: BarChart2, color: 'var(--text-secondary)', bg: 'rgba(132,142,156,0.1)', href: '/wallet' },
        ].map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="card flex-between gap-4 hover:border-[var(--border-focus)] hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs mt-1" style={{ color }}>{sub}</div>
            </div>
            <div className="flex-center w-11 h-11 rounded-xl shrink-0" style={{ background: bg, color }}>
              <Icon size={22} />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Market Analysis Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Fear & Greed */}
        <div className="card flex flex-col items-center justify-center gap-3 py-6">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Crypto Fear &amp; Greed
          </div>
          <div className="relative flex-center">
            <svg width={140} height={80} viewBox="0 0 140 80">
              {/* Background arc */}
              <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="var(--bg-tertiary)" strokeWidth="14" strokeLinecap="round"/>
              {/* Colored arc */}
              <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none"
                stroke={fearGreed.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(fearGreed.value / 100) * 188.5} 188.5`}
              />
            </svg>
            <div className="absolute bottom-1 text-center">
              <div className="text-3xl font-black font-mono" style={{ color: fearGreed.color }}>{fearGreed.value}</div>
              <div className="text-xs font-bold" style={{ color: fearGreed.color }}>{fearGreed.label}</div>
            </div>
          </div>
          <div className="flex justify-between w-full px-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--bear)' }}>Fear</span>
            <span style={{ color: 'var(--bull)' }}>Greed</span>
          </div>
        </div>

        {/* Market Breadth */}
        <div className="card flex flex-col gap-4 py-5">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Market Breadth (24h)
          </div>
          <div>
            <div className="flex-between text-sm mb-2">
              <span style={{ color: 'var(--bull)' }}>● {bullCount} Advancing</span>
              <span style={{ color: 'var(--bear)' }}>● {bearCount} Declining</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bear-dim)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${breadth}%`, background: 'var(--bull)' }} />
            </div>
            <div className="text-xs mt-1.5 text-center font-mono font-bold"
              style={{ color: breadth > 50 ? 'var(--bull)' : 'var(--bear)' }}>
              {breadth.toFixed(0)}% Bulls Dominant
            </div>
          </div>
          <div className="flex gap-2 mt-auto">
            {[
              { label: 'Avg Change', value: `${(markets.reduce((a, m) => a + m.change24h, 0) / (markets.length || 1)).toFixed(2)}%`, positive: markets.reduce((a, m) => a + m.change24h, 0) > 0 },
              { label: '24h Vol', value: `$${((markets.reduce((a, m) => a + m.volume24h, 0)) / 1e9).toFixed(1)}B`, positive: true },
            ].map(({ label, value, positive }) => (
              <div key={label} className="flex-1 p-2.5 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="font-mono font-bold text-sm" style={{ color: positive ? 'var(--bull)' : 'var(--bear)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Trade Access */}
        <div className="card flex flex-col gap-3 py-5">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Quick Trade
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {[
              { symbol: 'BTC', name: 'Bitcoin'   },
              { symbol: 'ETH', name: 'Ethereum'  },
              { symbol: 'SOL', name: 'Solana'    },
              { symbol: 'NVDA',name: 'NVIDIA'    },
            ].map(({ symbol, name }) => {
              const m = markets.find(x => x.symbol === symbol)
              return (
                <Link key={symbol} href={`/trade/${symbol}-USD`}
                  className="flex-between p-2.5 rounded-lg transition-colors hover:bg-[var(--bg-card-hover)]"
                  style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2.5">
                    <AssetIcon symbol={symbol} size={28} />
                    <div>
                      <div className="text-sm font-semibold">{symbol}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold">{m ? formatCurrency(m.price, true) : '—'}</div>
                    <div className={`text-[10px] font-bold ${(m?.change24h ?? 0) >= 0 ? 'text-bull' : 'text-bear'}`}>
                      {m ? formatPercentage(m.change24h) : '—'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Top Gainers / Losers ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Top Gainers', icon: <Rocket size={16} className="text-bull" />, items: topGainers, positive: true },
          { title: 'Top Losers', icon: <Flame size={16} className="text-bear" />, items: topLosers, positive: false },
        ].map(({ title, icon, items, positive }) => (
          <div key={title} className="card p-0 overflow-hidden hover:border-[var(--border-focus)] transition-all duration-300">
            <div className="px-4 py-3 flex-between" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2">{icon} {title}</h3>
              <Link href="/markets" className="text-xs" style={{ color: 'var(--accent)' }}>View All →</Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(43,49,57,0.4)' }}>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex-between px-4 py-3">
                      <div className="w-24 h-4 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                      <div className="w-16 h-4 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
                    </div>
                  ))
                : items.map(m => (
                    <Link key={m.id} href={`/trade/${m.symbol}-USD`}
                      className="flex-between px-4 py-3 transition-colors hover:bg-[var(--bg-card-hover)]">
                      <div className="flex items-center gap-3">
                        <AssetIcon symbol={m.symbol} size={30} imageUrl={m.image ?? null} />
                        <div>
                          <div className="font-semibold text-sm">{m.symbol}</div>
                          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{formatCurrency(m.price, true)}</div>
                        <div className={`text-xs font-bold ${positive ? 'text-bull' : 'text-bear'}`}>
                          {positive ? '▲' : '▼'} {Math.abs(m.change24h).toFixed(2)}%
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Transactions ─── */}
      {transactions.length > 0 && (
        <div className="card p-0 overflow-hidden hover:border-[var(--border-focus)] transition-all duration-300">
          <div className="px-4 py-3 flex-between" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm">Recent Transactions</h3>
            <Link href="/wallet" className="text-xs" style={{ color: 'var(--accent)' }}>View All →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(43,49,57,0.4)' }}>
            {transactions.slice(0, 4).map(tx => (
              <div key={tx.id} className="flex-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex-center text-xs font-bold"
                    style={{ background: tx.amount > 0 ? 'var(--bull-dim)' : 'var(--bear-dim)', color: tx.amount > 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {tx.amount > 0 ? '+' : '-'}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{tx.description || tx.type}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }} suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-sm" style={{ color: tx.amount > 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
