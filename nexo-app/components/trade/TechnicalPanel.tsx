'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { TechnicalSignal } from '@/lib/analysis/signals'
import { getSignalDisplay } from '@/lib/analysis/signals'
import { formatCurrency } from '@/lib/utils'

interface TechnicalPanelProps {
  analysis: TechnicalSignal
  currentPrice: number
}

function RSIGauge({ value }: { value: number }) {
  const pct = value / 100
  const color = value > 70 ? 'var(--bear)' : value < 30 ? 'var(--bull)' : 'var(--accent)'
  const zone = value > 70 ? 'Overbought' : value < 30 ? 'Oversold' : 'Neutral'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex-between text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>RSI (14)</span>
        <span className="font-mono font-bold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <div className="flex-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span>Oversold &lt;30</span>
        <span style={{ color }}>{zone}</span>
        <span>&gt;70 Overbought</span>
      </div>
    </div>
  )
}

export default function TechnicalPanel({ analysis, currentPrice }: TechnicalPanelProps) {
  const display = getSignalDisplay(analysis.signal)

  const indicators = [
    { label: 'EMA 20', value: formatCurrency(analysis.ema20, true), status: analysis.ema20 > analysis.ema50 ? 'bull' : 'bear' },
    { label: 'EMA 50', value: formatCurrency(analysis.ema50, true), status: analysis.ema20 > analysis.ema50 ? 'bull' : 'bear' },
    { label: 'BB Position', value: `${analysis.bbPosition.toFixed(0)}%`, status: analysis.bbPosition > 75 ? 'bear' : analysis.bbPosition < 25 ? 'bull' : 'neutral' },
    { label: 'MACD Hist.', value: analysis.macdHistogram.toFixed(6), status: analysis.macdHistogram > 0 ? 'bull' : 'bear' },
  ]

  return (
    <div className="card p-4 flex flex-col gap-4" style={{ background: 'var(--bg-card)' }}>
      <div className="flex-between flex-wrap gap-3">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>
          Technical Analysis
        </h3>

        {/* Overall Signal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm"
            style={{ background: display.bgColor, color: display.color, border: `1px solid ${display.borderColor}` }}>
            {display.label}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Score: <span className="font-mono font-bold" style={{ color: analysis.score > 0 ? 'var(--bull)' : analysis.score < 0 ? 'var(--bear)' : 'var(--text-secondary)' }}>
              {analysis.score > 0 ? '+' : ''}{analysis.score}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RSI Gauge */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <RSIGauge value={analysis.rsi} />
        </div>

        {/* Indicator Grid */}
        <div className="grid grid-cols-2 gap-2">
          {indicators.map(({ label, value, status }) => (
            <div key={label} className="p-2.5 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="font-mono font-bold text-xs"
                style={{ color: status === 'bull' ? 'var(--bull)' : status === 'bear' ? 'var(--bear)' : 'var(--text-secondary)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasons */}
      <div className="flex flex-wrap gap-2">
        {analysis.reasons.slice(0, 3).map((r, i) => (
          <span key={i} className="text-[11px] px-2 py-1 rounded-md"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            {r}
          </span>
        ))}
      </div>
    </div>
  )
}
