// lib/analysis/indicators.ts
// Implementación de indicadores técnicos estándar de trading

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// ─── RSI (Relative Strength Index) ──────────────────────────────────────────
// Estándar: periodo 14
// >70 = Sobrecomprado (señal de venta potencial)
// <30 = Sobrevendido (señal de compra potencial)
export function calcRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return []

  const rsi: number[] = []
  let avgGain = 0
  let avgLoss = 0

  // Inicializar con el primer periodo
  for (let i = 1; i <= period; i++) {
    const delta = closes[i] - closes[i - 1]
    if (delta > 0) avgGain += delta
    else avgLoss += Math.abs(delta)
  }
  avgGain /= period
  avgLoss /= period

  for (let i = period; i < closes.length; i++) {
    if (i > period) {
      const delta = closes[i] - closes[i - 1]
      const gain = delta > 0 ? delta : 0
      const loss = delta < 0 ? Math.abs(delta) : 0
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi.push(100 - 100 / (1 + rs))
  }

  return rsi
}

// ─── EMA (Exponential Moving Average) ───────────────────────────────────────
export function calcEMA(values: number[], period: number): number[] {
  if (values.length < period) return []
  const k = 2 / (period + 1)
  const ema: number[] = []

  // Primer EMA = SMA del primer periodo
  let firstSMA = 0
  for (let i = 0; i < period; i++) firstSMA += values[i]
  firstSMA /= period
  ema.push(firstSMA)

  for (let i = period; i < values.length; i++) {
    ema.push(values[i] * k + ema[ema.length - 1] * (1 - k))
  }
  return ema
}

// ─── SMA (Simple Moving Average) ─────────────────────────────────────────────
export function calcSMA(values: number[], period: number): number[] {
  const sma: number[] = []
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

// ─── Bollinger Bands ─────────────────────────────────────────────────────────
export interface BollingerBand {
  upper: number
  middle: number
  lower: number
}

export function calcBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2
): BollingerBand[] {
  const bands: BollingerBand[] = []
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    bands.push({
      upper: mean + multiplier * stdDev,
      middle: mean,
      lower: mean - multiplier * stdDev,
    })
  }
  return bands
}

// ─── MACD (Moving Average Convergence Divergence) ────────────────────────────
export interface MACDResult {
  macd: number
  signal: number
  histogram: number
}

export function calcMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult[] {
  const fastEMA = calcEMA(closes, fastPeriod)
  const slowEMA = calcEMA(closes, slowPeriod)
  
  // Alinear las EMAs (la lenta es más corta)
  const diff = slowPeriod - fastPeriod
  const macdLine = slowEMA.map((slow, i) => fastEMA[i + diff] - slow)
  const signalLine = calcEMA(macdLine, signalPeriod)
  
  const signalOffset = macdLine.length - signalLine.length
  return signalLine.map((sig, i) => ({
    macd: macdLine[i + signalOffset],
    signal: sig,
    histogram: macdLine[i + signalOffset] - sig,
  }))
}

// ─── ATR (Average True Range) — mide volatilidad ─────────────────────────────
export function calcATR(candles: Candle[], period = 14): number[] {
  if (candles.length < 2) return []
  
  const trueRanges: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high
    const low = candles[i].low
    const prevClose = candles[i - 1].close
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }
  return calcEMA(trueRanges, period)
}

// ─── Fear & Greed Index (0–100) ───────────────────────────────────────────────
// Basado en: volatilidad (25%), momentum (25%), volumen (25%), tendencia (25%)
export function calcFearGreedIndex(
  recentPrices: number[],
  volumes?: number[]
): { value: number; label: string; color: string } {
  if (recentPrices.length < 10) return { value: 50, label: 'Neutral', color: '#848E9C' }

  // 1. Momentum: % change últimos 10 días vs 30 días
  const recent10 = recentPrices.slice(-10)
  const recent30 = recentPrices.slice(-30)
  const momentum10 = ((recent10[recent10.length - 1] - recent10[0]) / recent10[0]) * 100
  const momentum30 = recent30.length > 1
    ? ((recent30[recent30.length - 1] - recent30[0]) / recent30[0]) * 100
    : momentum10

  // Normalizar momentum [-20%, +20%] → [0, 100]
  const normMomentum = Math.min(100, Math.max(0, ((momentum10 + 20) / 40) * 100))
  const normMomentum30 = Math.min(100, Math.max(0, ((momentum30 + 20) / 40) * 100))

  // 2. Volatilidad inversa (menor volatilidad = más greedy)
  const sma7 = recentPrices.slice(-7)
  const mean7 = sma7.reduce((a, b) => a + b, 0) / sma7.length
  const volatility = Math.sqrt(sma7.reduce((s, v) => s + Math.pow(v - mean7, 2), 0) / sma7.length) / mean7
  const normVolatility = Math.min(100, Math.max(0, (1 - volatility * 10) * 100))

  // 3. Precio relativo al SMA (por encima = greed)
  const smaVal = calcSMA(recentPrices, Math.min(20, recentPrices.length))
  const lastSMA = smaVal[smaVal.length - 1] ?? recentPrices[recentPrices.length - 1]
  const lastPrice = recentPrices[recentPrices.length - 1]
  const priceSMADiff = ((lastPrice - lastSMA) / lastSMA) * 100
  const normPriceSMA = Math.min(100, Math.max(0, ((priceSMADiff + 10) / 20) * 100))

  // Ponderado
  const index = normMomentum * 0.35 + normMomentum30 * 0.25 + normVolatility * 0.2 + normPriceSMA * 0.2

  const value = Math.round(index)

  let label: string
  let color: string
  if (value >= 75) { label = 'Extreme Greed'; color = '#0ECB81' }
  else if (value >= 55) { label = 'Greed'; color = '#52c41a' }
  else if (value >= 45) { label = 'Neutral'; color = '#848E9C' }
  else if (value >= 25) { label = 'Fear'; color = '#F0B90B' }
  else { label = 'Extreme Fear'; color = '#F6465D' }

  return { value, label, color }
}

// ─── Generar datos de velas mock históricos ────────────────────────────────────
export function generateCandleData(basePrice: number, count = 200): Candle[] {
  const candles: Candle[] = []
  const now = Math.floor(Date.now() / 1000)
  const step = 3600 // 1 hora

  let price = basePrice * 0.75

  for (let i = count; i >= 0; i--) {
    const volatility = price * 0.015
    const open = price
    const close = price + (Math.random() - 0.47) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    candles.push({
      time: now - i * step,
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
      volume: Math.floor(Math.random() * 1000 + 100),
    })

    price = close
  }

  // Asegurar que el último cierre esté cerca del precio actual
  const last = candles[candles.length - 1]
  last.close = basePrice
  last.high = Math.max(last.open, basePrice) * 1.002
  last.low = Math.min(last.open, basePrice) * 0.998

  return candles
}
