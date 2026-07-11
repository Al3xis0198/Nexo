/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, TrendingDown, Activity,
  Loader2, Rocket, Minus, AlertCircle
} from 'lucide-react'
import OrderPanel from '@/components/trade/OrderPanel'
import TechnicalPanel from '@/components/trade/TechnicalPanel'
import { formatCurrency } from '@/lib/utils'
import { useTradingStore } from '@/lib/store'
import { analyzeCandles, getSignalDisplay } from '@/lib/analysis/signals'
import type { Candle } from '@/lib/analysis/indicators'
import type { Timeframe } from '@/components/charts/TradingChart'
import { useParams } from 'next/navigation'

const SignalIconMap: Record<string, React.ElementType> = {
  'rocket':        Rocket,
  'trending-up':   TrendingUp,
  'minus':         Minus,
  'trending-down': TrendingDown,
  'alert-circle':  AlertCircle,
}

const TradingChart = dynamic(() => import('@/components/charts/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="flex-center h-full min-h-[400px]" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  ),
})

// ── Timeframe intervals in seconds ────────────────────────────────────────────
const TF_SECONDS: Record<Timeframe, number> = {
  '1m':  60,
  '5m':  300,
  '15m': 900,
  '1H':  3600,
  '4H':  14400,
  '1D':  86400,
}

// ── Generate realistic historical candles ─────────────────────────────────────
function generateCandles(basePrice: number, count: number, intervalSec: number): Candle[] {
  const candles: Candle[] = []
  let price = basePrice

  // Volatility scales with timeframe
  const volatility = intervalSec <= 60 ? 0.0015
    : intervalSec <= 300 ? 0.003
    : intervalSec <= 900 ? 0.005
    : intervalSec <= 3600 ? 0.008
    : intervalSec <= 14400 ? 0.015
    : 0.025

  const nowSec = Math.floor(Date.now() / 1000)
  const startSec = nowSec - count * intervalSec

  for (let i = 0; i < count; i++) {
    const time = startSec + i * intervalSec
    const open = price

    // Multi-point simulation within candle for realistic wicks
    const points = 8
    let hi = open, lo = open
    let cur = open
    for (let j = 0; j < points; j++) {
      const move = cur * volatility * (Math.random() - 0.48)
      cur += move
      if (cur > hi) hi = cur
      if (cur < lo) lo = cur
    }

    // Add extra wick noise
    hi *= 1 + Math.random() * volatility * 0.5
    lo *= 1 - Math.random() * volatility * 0.5

    const close = cur
    const volume = Math.random() * 1_000_000 + 200_000

    candles.push({ time: time as any, open, high: hi, low: lo, close, volume } as Candle & { volume: number })
    price = close
  }

  return candles
}

// ── Resample candles by timeframe ─────────────────────────────────────────────
function resampleCandles(candles: Candle[], intervalSec: number): Candle[] {
  if (candles.length === 0) return []
  const groups: Record<number, Candle[]> = {}

  for (const c of candles) {
    const bucket = Math.floor((c.time as number) / intervalSec) * intervalSec
    if (!groups[bucket]) groups[bucket] = []
    groups[bucket].push(c)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([time, group]) => ({
      time: Number(time) as any,
      open:   group[0].open,
      high:   Math.max(...group.map(g => g.high)),
      low:    Math.min(...group.map(g => g.low)),
      close:  group[group.length - 1].close,
      volume: group.reduce((s, g) => s + ((g as any).volume ?? 0), 0),
    } as Candle))
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TradePage() {
  const params = useParams()
  const rawSymbol = params.symbol as string
  const symbol = rawSymbol
    ? decodeURIComponent(rawSymbol).replace('-', '/').toUpperCase()
    : 'BTC/USD'

  const [price, setPrice]           = useState(0)
  const [prevPrice, setPrevPrice]   = useState(0)
  const [baseCandles, setBaseCandles] = useState<Candle[]>([])   // 1-min base data
  const [candles, setCandles]       = useState<Candle[]>([])     // resampled for TF
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<'positions' | 'history'>('positions')
  const [timeframe, setTimeframe]   = useState<Timeframe>('1H')

  const positions     = useTradingStore(s => s.positions)
  const closePosition = useTradingStore(s => s.closePosition)
  const activePositions = positions.filter(p => p.symbol === symbol)

  // ── Load historical data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fetchCandles = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/prices/${encodeURIComponent(symbol.replace('/', '-'))}?count=500`)
        if (res.ok && !cancelled) {
          const data: Candle[] = await res.json()
          setBaseCandles(data)
          const lastClose = data.at(-1)?.close ?? 0
          setPrice(lastClose)
          setPrevPrice(lastClose)
        }
      } catch {
        // If API fails, generate mock data
        if (!cancelled) {
          const mockPrice = symbol.startsWith('BTC') ? 67000
            : symbol.startsWith('ETH') ? 3500
            : symbol.startsWith('XAU') ? 2345
            : 100
          const generated = generateCandles(mockPrice, 500, 60)
          setBaseCandles(generated)
          const lastClose = generated.at(-1)?.close ?? mockPrice
          setPrice(lastClose)
          setPrevPrice(lastClose)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCandles()
    return () => { cancelled = true }
  }, [symbol])

  // ── Resample when timeframe or base data changes ──────────────────────────
  useEffect(() => {
    if (baseCandles.length === 0) return
    const intervalSec = TF_SECONDS[timeframe]
    const resampled = resampleCandles(baseCandles, intervalSec)
    setCandles(resampled)
  }, [baseCandles, timeframe])

  // ── Real-time price simulation ────────────────────────────────────────────
  useEffect(() => {
    if (price === 0) return
    const interval = setInterval(() => {
      setPrice(prev => {
        const move = prev * 0.0006 * (Math.random() - 0.48)
        const next = prev + move
        setPrevPrice(prev)

        // Update last base candle (1m)
        setBaseCandles(c => {
          if (!c.length) return c
          const nowSec = Math.floor(Date.now() / 1000)
          const last = { ...c[c.length - 1] }
          const lastTime = last.time as number
          const newMinBucket = Math.floor(nowSec / 60) * 60

          if (newMinBucket > lastTime) {
            // New 1m candle
            return [...c, {
              time:   newMinBucket as any,
              open:   prev, high: Math.max(prev, next),
              low:    Math.min(prev, next), close: next,
              volume: Math.random() * 500_000 + 100_000,
            } as Candle]
          } else {
            // Update current candle
            last.close = next
            last.high  = Math.max(last.high, next)
            last.low   = Math.min(last.low, next)
            return [...c.slice(0, -1), last]
          }
        })
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [price])

  // ── Technical analysis ────────────────────────────────────────────────────
  const analysis = candles.length > 50 ? analyzeCandles(candles) : null
  const signalDisplay = analysis ? getSignalDisplay(analysis.signal) : null

  const priceChange = price - prevPrice
  const isUp = priceChange >= 0

  const calcPnl = (pos: any) => {
    const isLong = pos.type === 'buy'
    const diff = isLong ? price - pos.entryPrice : pos.entryPrice - price
    return pos.amount * (diff / pos.entryPrice)
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in" style={{ minHeight: '100%', paddingBottom: 24 }}>

      {/* ─── Header Strip ─── */}
      <div className="card py-3 px-4 flex items-center justify-between shrink-0 flex-wrap gap-3 hover:border-[var(--border-focus)] transition-all duration-300">
        <div className="flex items-center gap-4">
          <Link href="/markets" className="flex-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex-center font-bold text-sm"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(240,185,11,0.2)' }}>
              {symbol.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-base leading-tight">{symbol}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Perpetual · {loading ? '…' : 'Live'} · {timeframe}</div>
            </div>
          </div>

          <div className="w-px h-8" style={{ background: 'var(--border)' }} />

          {/* Current Price */}
          <div>
            <div className={`font-mono font-bold text-xl leading-tight ${isUp ? 'text-bull' : 'text-bear'}`}>
              {loading ? '—' : formatCurrency(price, symbol.length <= 4)}
            </div>
            <div className={`text-xs font-medium ${isUp ? 'text-bull' : 'text-bear'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(priceChange).toFixed(symbol.length <= 4 ? 2 : 5)}
            </div>
          </div>

          {/* Signal Badge */}
          {signalDisplay && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{ background: signalDisplay.bgColor, color: signalDisplay.color, border: `1px solid ${signalDisplay.borderColor}` }}>
              {(() => { const Icon = SignalIconMap[signalDisplay.iconId] || Minus; return <Icon size={16} /> })()}
              {signalDisplay.label}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {[
            { label: '24h High', value: loading ? '—' : formatCurrency(price * 1.015, symbol.length <= 4), color: 'var(--bull)' },
            { label: '24h Low',  value: loading ? '—' : formatCurrency(price * 0.985, symbol.length <= 4), color: 'var(--bear)' },
            { label: 'RSI(14)',  value: analysis ? analysis.rsi.toFixed(1) : '—', color: analysis && analysis.rsi > 70 ? 'var(--bear)' : analysis && analysis.rsi < 30 ? 'var(--bull)' : 'var(--text-primary)' },
            { label: 'Volume',   value: candles.length ? `${((candles.at(-1) as any)?.volume / 1e6 || 0).toFixed(1)}M` : '—', color: 'var(--text-secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="font-mono font-semibold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">

        {/* Chart + Tabs */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          <div className="chart-container flex-1 min-h-[400px]">
            {!loading && candles.length > 0 && (
              <TradingChart
                data={candles}
                height={450}
                currentTimeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            )}
            {loading && (
              <div className="flex-center h-full min-h-[400px]" style={{ background: '#13161A', borderRadius: 12 }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            )}
          </div>

          {/* Technical Panel */}
          {analysis && (
            <div className="shrink-0">
              <TechnicalPanel analysis={analysis} currentPrice={price} />
            </div>
          )}

          {/* Positions / History Tabs */}
          <div className="card p-0 overflow-hidden shrink-0 max-h-[260px] flex flex-col hover:border-[var(--border-focus)] transition-all duration-300">
            <div className="flex items-center gap-4 px-4 py-2.5"
              style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
              {(['positions', 'history'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="text-sm font-medium pb-0.5 border-b-2 transition-colors capitalize"
                  style={{ borderColor: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {tab} {tab === 'positions' && `(${activePositions.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === 'positions' && (
                activePositions.length === 0 ? (
                  <div className="flex-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No open positions for {symbol} — use the panel to open one
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table className="table w-full" style={{ minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th>Type</th><th>Size</th><th>Entry</th><th>Mark</th><th>PnL</th><th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePositions.map(pos => {
                          const pnl = calcPnl(pos)
                          const pnlPct = (pnl / (pos.amount / pos.leverage)) * 100
                          return (
                            <tr key={pos.id}>
                              <td><span className={`badge ${pos.type === 'buy' ? 'badge-bull' : 'badge-bear'}`}>{pos.type.toUpperCase()}</span><span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{pos.leverage}x</span></td>
                              <td className="font-mono">{formatCurrency(pos.amount)}</td>
                              <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(pos.entryPrice, true)}</td>
                              <td className="font-mono">{formatCurrency(price, true)}</td>
                              <td>
                                <div className={`font-mono font-bold ${pnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                                  <span className="text-xs font-normal ml-1 opacity-75">({pnlPct.toFixed(1)}%)</span>
                                </div>
                              </td>
                              <td className="text-right">
                                <button onClick={() => closePosition(pos.id, price, pnl)}
                                  className="btn btn-sm btn-ghost hover:text-bear hover:border-bear">
                                  Close
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
              {activeTab === 'history' && (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table className="table w-full" style={{ minWidth: 500 }}>
                    <thead><tr><th>Type</th><th>Description</th><th className="text-right">Amount</th><th className="text-right">Date</th></tr></thead>
                    <tbody>
                      {useTradingStore.getState().transactions.filter(t => t.description?.includes(symbol)).length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>No trade history for {symbol}</td></tr>
                      ) : (
                        useTradingStore.getState().transactions
                          .filter(t => t.description?.includes(symbol))
                          .slice(0, 20)
                          .map(tx => (
                            <tr key={tx.id}>
                              <td><span className={`badge ${tx.type === 'trade_close' ? (tx.amount >= 0 ? 'badge-bull' : 'badge-bear') : 'badge-neutral'}`}>{tx.type.replace('_', ' ').toUpperCase()}</span></td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                              <td className="text-right font-mono font-bold" style={{ color: tx.amount >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}</td>
                              <td className="text-right" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}><span suppressHydrationWarning>{new Date(tx.date).toLocaleString()}</span></td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Panel */}
        <div className="w-full xl:w-[300px] shrink-0">
          <OrderPanel symbol={symbol} currentPrice={price} />
        </div>
      </div>
    </div>
  )
}
