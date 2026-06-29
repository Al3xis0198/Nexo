// lib/analysis/signals.ts
// Motor de señales de trading basado en indicadores técnicos

import { calcRSI, calcEMA, calcBollingerBands, calcMACD, type Candle } from './indicators'

export type SignalStrength = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'

export interface TechnicalSignal {
  signal: SignalStrength
  score: number        // -100 a +100 (negativo = bajista, positivo = alcista)
  rsi: number
  ema20: number
  ema50: number
  bbPosition: number   // 0-100: posición dentro de BB (0=low, 100=high)
  macdHistogram: number
  reasons: string[]
}

export interface SignalDisplay {
  label: string
  color: string
  bgColor: string
  borderColor: string
  iconId: string
}

export function getSignalDisplay(signal: SignalStrength): SignalDisplay {
  switch (signal) {
    case 'STRONG_BUY':
      return { label: 'Strong Buy', color: '#0ECB81', bgColor: 'rgba(14,203,129,0.15)', borderColor: 'rgba(14,203,129,0.4)', iconId: 'rocket' }
    case 'BUY':
      return { label: 'Buy', color: '#52c41a', bgColor: 'rgba(82,196,26,0.12)', borderColor: 'rgba(82,196,26,0.3)', iconId: 'trending-up' }
    case 'NEUTRAL':
      return { label: 'Neutral', color: '#848E9C', bgColor: 'rgba(132,142,156,0.12)', borderColor: 'rgba(132,142,156,0.3)', iconId: 'minus' }
    case 'SELL':
      return { label: 'Sell', color: '#F0B90B', bgColor: 'rgba(240,185,11,0.12)', borderColor: 'rgba(240,185,11,0.3)', iconId: 'trending-down' }
    case 'STRONG_SELL':
      return { label: 'Strong Sell', color: '#F6465D', bgColor: 'rgba(246,70,93,0.15)', borderColor: 'rgba(246,70,93,0.4)', iconId: 'alert-circle' }
  }
}

export function analyzeCandles(candles: Candle[]): TechnicalSignal {
  if (candles.length < 50) {
    return { signal: 'NEUTRAL', score: 0, rsi: 50, ema20: candles.at(-1)?.close ?? 0, ema50: candles.at(-1)?.close ?? 0, bbPosition: 50, macdHistogram: 0, reasons: ['Insufficient data'] }
  }

  const closes = candles.map(c => c.close)

  // ─── Calcular indicadores ─────────────────────────────────────────────────
  const rsiArr = calcRSI(closes, 14)
  const rsi = rsiArr[rsiArr.length - 1] ?? 50

  const ema20Arr = calcEMA(closes, 20)
  const ema20 = ema20Arr[ema20Arr.length - 1] ?? closes.at(-1)!

  const ema50Arr = calcEMA(closes, 50)
  const ema50 = ema50Arr[ema50Arr.length - 1] ?? closes.at(-1)!

  const bbArr = calcBollingerBands(closes, 20, 2)
  const lastBB = bbArr[bbArr.length - 1]
  const currentPrice = closes[closes.length - 1]
  const bbRange = lastBB ? lastBB.upper - lastBB.lower : 1
  const bbPosition = lastBB ? Math.min(100, Math.max(0, ((currentPrice - lastBB.lower) / bbRange) * 100)) : 50

  const macdArr = calcMACD(closes, 12, 26, 9)
  const lastMACD = macdArr[macdArr.length - 1]
  const macdHistogram = lastMACD?.histogram ?? 0

  // ─── Sistema de puntuación ────────────────────────────────────────────────
  let score = 0
  const reasons: string[] = []

  // RSI (±25 puntos)
  if (rsi < 25) {
    score += 25
    reasons.push(`RSI ${rsi.toFixed(1)} — Extreme oversold`)
  } else if (rsi < 35) {
    score += 18
    reasons.push(`RSI ${rsi.toFixed(1)} — Oversold`)
  } else if (rsi < 45) {
    score += 8
    reasons.push(`RSI ${rsi.toFixed(1)} — Approaching oversold`)
  } else if (rsi > 75) {
    score -= 25
    reasons.push(`RSI ${rsi.toFixed(1)} — Extreme overbought`)
  } else if (rsi > 65) {
    score -= 18
    reasons.push(`RSI ${rsi.toFixed(1)} — Overbought`)
  } else if (rsi > 55) {
    score -= 8
    reasons.push(`RSI ${rsi.toFixed(1)} — Approaching overbought`)
  } else {
    reasons.push(`RSI ${rsi.toFixed(1)} — Neutral zone`)
  }

  // EMA Cross (±30 puntos)
  const emaDiff = ((ema20 - ema50) / ema50) * 100
  if (emaDiff > 2) {
    score += 30
    reasons.push('Golden Cross — EMA20 significantly above EMA50')
  } else if (emaDiff > 0.5) {
    score += 18
    reasons.push('Bullish — EMA20 above EMA50')
  } else if (emaDiff > 0) {
    score += 8
    reasons.push('Slightly bullish — EMA20 marginally above EMA50')
  } else if (emaDiff < -2) {
    score -= 30
    reasons.push('Death Cross — EMA20 significantly below EMA50')
  } else if (emaDiff < -0.5) {
    score -= 18
    reasons.push('Bearish — EMA20 below EMA50')
  } else {
    score -= 8
    reasons.push('Slightly bearish — EMA20 marginally below EMA50')
  }

  // Bollinger Bands Position (±25 puntos)
  if (bbPosition < 10) {
    score += 25
    reasons.push('Price at lower Bollinger Band — strong bounce potential')
  } else if (bbPosition < 25) {
    score += 12
    reasons.push('Price near lower Bollinger Band — bullish territory')
  } else if (bbPosition > 90) {
    score -= 25
    reasons.push('Price at upper Bollinger Band — overbought warning')
  } else if (bbPosition > 75) {
    score -= 12
    reasons.push('Price near upper Bollinger Band — bearish territory')
  }

  // MACD Histogram (±20 puntos)
  if (macdHistogram > 0) {
    score += Math.min(20, macdHistogram * 1000)
    reasons.push('MACD histogram positive — bullish momentum')
  } else if (macdHistogram < 0) {
    score -= Math.min(20, Math.abs(macdHistogram) * 1000)
    reasons.push('MACD histogram negative — bearish momentum')
  }

  // ─── Clasificar señal ─────────────────────────────────────────────────────
  let signal: SignalStrength
  if (score >= 55) signal = 'STRONG_BUY'
  else if (score >= 20) signal = 'BUY'
  else if (score >= -20) signal = 'NEUTRAL'
  else if (score >= -55) signal = 'SELL'
  else signal = 'STRONG_SELL'

  return { signal, score, rsi, ema20, ema50, bbPosition, macdHistogram, reasons }
}
