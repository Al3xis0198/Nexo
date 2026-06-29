/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect, use } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Loader2, Search, ChevronDown, Rocket, Minus, AlertCircle } from 'lucide-react'
import OrderPanel from '@/components/trade/OrderPanel'
import TechnicalPanel from '@/components/trade/TechnicalPanel'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { useTradingStore } from '@/lib/store'
import { analyzeCandles, getSignalDisplay } from '@/lib/analysis/signals'
import type { Candle } from '@/lib/analysis/indicators'

import { useParams } from 'next/navigation'

const SignalIconMap: Record<string, React.ElementType> = {
  'rocket': Rocket,
  'trending-up': TrendingUp,
  'minus': Minus,
  'trending-down': TrendingDown,
  'alert-circle': AlertCircle,
}

const TradingChart = dynamic(() => import('@/components/charts/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="flex-center h-full min-h-[400px]" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
    </div>
  ),
})

export default function TradePage() {
  const params = useParams()
  const rawSymbol = params.symbol as string
  const symbol = rawSymbol ? decodeURIComponent(rawSymbol).replace('-', '/').toUpperCase() : 'BTC/USD'

  const [price, setPrice] = useState(0)
  const [prevPrice, setPrevPrice] = useState(0)
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')

  const positions = useTradingStore(s => s.positions)
  const closePosition = useTradingStore(s => s.closePosition)
  const activePositions = positions.filter(p => p.symbol === symbol)

  // Cargar datos históricos desde API
  useEffect(() => {
    const fetchCandles = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/prices/${encodeURIComponent(symbol.replace('/', '-'))}?count=200`)
        if (res.ok) {
          const data: Candle[] = await res.json()
          setCandles(data)
          const lastClose = data.at(-1)?.close ?? 0
          setPrice(lastClose)
          setPrevPrice(lastClose)
        }
      } catch (err) {
        console.error('Failed to load candles:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCandles()
  }, [symbol])

  // Simular precio en tiempo real
  useEffect(() => {
    if (price === 0) return
    const interval = setInterval(() => {
      setPrice(prev => {
        const move = prev * 0.0008 * (Math.random() - 0.48)
        const next = prev + move
        setPrevPrice(prev)

        // Actualizar última vela
        setCandles(c => {
          if (!c.length) return c
          const last = { ...c[c.length - 1] }
          last.close = next
          last.high = Math.max(last.high, next)
          last.low = Math.min(last.low, next)
          return [...c.slice(0, -1), last]
        })
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [price])

  // Análisis técnico
  const analysis = candles.length > 50 ? analyzeCandles(candles) : null
  const signalDisplay = analysis ? getSignalDisplay(analysis.signal) : null

  const priceChange = price - prevPrice
  const isUp = priceChange >= 0

  const calcPnl = (pos: any) => {
    const isLong = pos.type === 'buy'
    const diff = isLong ? price - pos.entryPrice : pos.entryPrice - price
    const notional = pos.amount  // total notional = margin * leverage
    return notional * (diff / pos.entryPrice)
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
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Perpetual · {loading ? '…' : 'Live'}</div>
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
              {(() => {
                const Icon = SignalIconMap[signalDisplay.iconId] || Minus;
                return <Icon size={16} />
              })()}
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
          <div className="chart-container flex-1 min-h-[350px]">
            {!loading && candles.length > 0 && (
              <TradingChart data={candles} />
            )}
          </div>

          {/* Technical Panel */}
          {analysis && (
            <div className="shrink-0">
              <TechnicalPanel analysis={analysis} currentPrice={price} />
            </div>
          )}

          {/* Positions Tabs */}
          <div className="card p-0 overflow-hidden shrink-0 max-h-[250px] flex flex-col hover:border-[var(--border-focus)] transition-all duration-300">
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
