// app/api/prices/[symbol]/route.ts
// Genera datos históricos de velas para el gráfico

import { NextResponse } from 'next/server'
import { generateCandleData } from '@/lib/analysis/indicators'

const BASE_PRICES: Record<string, number> = {
  'BTC': 64520, 'ETH': 3450, 'BNB': 590, 'SOL': 145, 'XRP': 0.621,
  'DOGE': 0.152, 'ADA': 0.458, 'AVAX': 36.4,
  'AAPL': 189.45, 'TSLA': 215.30, 'NVDA': 890.10, 'MSFT': 420.50,
  'EURUSD': 1.0854, 'GBPUSD': 1.2640, 'USDJPY': 151.20,
  'XAUUSD': 2345.60, 'XAGUSD': 28.40, 'WTIUSD': 82.50,
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const cleanSymbol = symbol.replace('-', '').replace('/', '').toUpperCase()
  
  // Buscar precio base — quitar sufijos comunes
  const baseKey = Object.keys(BASE_PRICES).find(k => 
    cleanSymbol.startsWith(k) || k.startsWith(cleanSymbol.substring(0, 3))
  )
  
  const basePrice = BASE_PRICES[baseKey ?? ''] ?? 100

  const { searchParams } = new URL(request.url)
  const count = parseInt(searchParams.get('count') ?? '200')

  const candles = generateCandleData(basePrice, Math.min(count, 500))

  return NextResponse.json(candles, {
    headers: { 'Cache-Control': 'no-cache' },
  })
}
