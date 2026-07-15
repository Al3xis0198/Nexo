// app/api/markets/route.ts
export const dynamic = 'force-dynamic'
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Proxy server-side para CoinGecko — evita CORS y protege la API key

import { NextResponse } from 'next/server'

const CMC_BASE = 'https://pro-api.coinmarketcap.com/v1'
const API_KEY = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY || process.env.COINMARKETCAP_API_KEY

// Cache simple en memoria para no superar rate limit
let cache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 60_000 // 60 segundos (CMC tiene rate limits más estrictos)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'all'

  // Si tenemos caché válida y la petición es de crypto, devolver eso
  if (category === 'crypto' && cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60' },
    })
  }

  // Si es crypto, fetcher desde CoinMarketCap
  if (category === 'crypto' || category === 'all') {
    try {
      if (!API_KEY || API_KEY.includes('YOUR_')) {
        // Si no hay API key, devolvemos mock inmediatamente para no fallar
        return NextResponse.json(getMockCrypto(), { headers: { 'X-Source': 'mock-no-key' } })
      }

      const headers: Record<string, string> = { 
        'Accept': 'application/json',
        'X-CMC_PRO_API_KEY': API_KEY 
      }

      const res = await fetch(
        `${CMC_BASE}/cryptocurrency/listings/latest?limit=200&convert=USD`,
        { headers, next: { revalidate: 60 } }
      )

      if (res.ok) {
        const raw = await res.json()
        const cryptoData = raw.data.map((coin: any) => ({
          id: coin.slug, // CMC usa slug para identificadores en URLs (ej. bitcoin)
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.quote.USD.price,
          change24h: coin.quote.USD.percent_change_24h ?? 0,
          change7d: coin.quote.USD.percent_change_7d ?? 0,
          volume24h: coin.quote.USD.volume_24h,
          marketCap: coin.quote.USD.market_cap,
          high24h: coin.quote.USD.price * 1.05, // CMC no da high/low en endpoints básicos
          low24h: coin.quote.USD.price * 0.95,
          image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
          type: 'crypto',
        }))

        cache = { data: cryptoData, timestamp: Date.now() }

        return NextResponse.json(cryptoData, {
          headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=60' },
        })
      } else {
        // Si CoinMarketCap falla, devolver mock data
        return NextResponse.json(getMockCrypto(), { headers: { 'X-Source': 'mock-api-fail' } })
      }
    } catch (err) {
      return NextResponse.json(getMockCrypto(), { headers: { 'X-Source': 'mock-error' } })
    }
  }

  // Para otros assets devolver mock
  return NextResponse.json(getMockMarkets(category))
}

function getMockCrypto() {
  return [
    { id: 'bitcoin',   symbol: 'BTC', name: 'Bitcoin',  price: 64520.10, change24h: 2.45,  change7d: 5.2,  volume24h: 35_000_000_000, marketCap: 1_250_000_000_000, high24h: 65100, low24h: 63200, image: null, type: 'crypto' },
    { id: 'ethereum',  symbol: 'ETH', name: 'Ethereum', price: 3450.80,  change24h: 1.12,  change7d: 3.8,  volume24h: 15_000_000_000, marketCap: 415_000_000_000,   high24h: 3500,  low24h: 3380,  image: null, type: 'crypto' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB',   price: 590.25,   change24h: -0.5,  change7d: -1.2, volume24h: 1_200_000_000,  marketCap: 89_000_000_000,    high24h: 600,   low24h: 582,   image: null, type: 'crypto' },
    { id: 'solana',    symbol: 'SOL', name: 'Solana',   price: 145.30,   change24h: -4.2,  change7d: -8.5, volume24h: 2_800_000_000,  marketCap: 65_000_000_000,    high24h: 152,   low24h: 141,   image: null, type: 'crypto' },
    { id: 'ripple',    symbol: 'XRP', name: 'XRP',      price: 0.6210,   change24h: 0.8,   change7d: 2.1,  volume24h: 1_100_000_000,  marketCap: 34_000_000_000,    high24h: 0.635, low24h: 0.610, image: null, type: 'crypto' },
    { id: 'dogecoin',  symbol: 'DOGE',name: 'Dogecoin', price: 0.1520,   change24h: 6.2,   change7d: 12.4, volume24h: 1_800_000_000,  marketCap: 21_000_000_000,    high24h: 0.158, low24h: 0.141, image: null, type: 'crypto' },
    { id: 'cardano',   symbol: 'ADA', name: 'Cardano',  price: 0.4580,   change24h: -1.8,  change7d: -3.5, volume24h: 450_000_000,    marketCap: 16_000_000_000,    high24h: 0.470, low24h: 0.445, image: null, type: 'crypto' },
    { id: 'avalanche', symbol: 'AVAX',name: 'Avalanche',price: 36.40,    change24h: 3.5,   change7d: 8.2,  volume24h: 550_000_000,    marketCap: 15_000_000_000,    high24h: 37.2,  low24h: 34.8,  image: null, type: 'crypto' },
  ]
}

function getMockMarkets(category: string) {
  const data: Record<string, any[]> = {
    stock: [
      { id: 'AAPL',  symbol: 'AAPL', name: 'Apple Inc.',        price: 189.45, change24h: 1.2,  change7d: 2.8,  volume24h: 54_000_000,  marketCap: 2_900_000_000_000, type: 'stock' },
      { id: 'TSLA',  symbol: 'TSLA', name: 'Tesla Inc.',         price: 215.30, change24h: -2.4, change7d: -5.1, volume24h: 120_000_000, marketCap: 680_000_000_000,   type: 'stock' },
      { id: 'NVDA',  symbol: 'NVDA', name: 'NVIDIA Corp.',       price: 890.10, change24h: 4.5,  change7d: 9.8,  volume24h: 45_000_000,  marketCap: 2_200_000_000_000, type: 'stock' },
      { id: 'MSFT',  symbol: 'MSFT', name: 'Microsoft Corp.',    price: 420.50, change24h: 0.8,  change7d: 1.5,  volume24h: 22_000_000,  marketCap: 3_100_000_000_000, type: 'stock' },
      { id: 'AMZN',  symbol: 'AMZN', name: 'Amazon.com Inc.',    price: 178.90, change24h: -0.5, change7d: 0.9,  volume24h: 38_000_000,  marketCap: 1_800_000_000_000, type: 'stock' },
      { id: 'GOOGL', symbol: 'GOOGL',name: 'Alphabet Inc.',      price: 172.40, change24h: 1.8,  change7d: 3.2,  volume24h: 28_000_000,  marketCap: 2_150_000_000_000, type: 'stock' },
    ],
    forex: [
      { id: 'EURUSD', symbol: 'EUR/USD', name: 'Euro / US Dollar',          price: 1.0854, change24h: -0.15, change7d: 0.3,  volume24h: 2_500_000_000, marketCap: 0, type: 'forex' },
      { id: 'GBPUSD', symbol: 'GBP/USD', name: 'British Pound / USD',       price: 1.2640, change24h: 0.25,  change7d: -0.5, volume24h: 1_800_000_000, marketCap: 0, type: 'forex' },
      { id: 'USDJPY', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen',  price: 151.20, change24h: 0.40,  change7d: 1.2,  volume24h: 2_100_000_000, marketCap: 0, type: 'forex' },
      { id: 'AUDUSD', symbol: 'AUD/USD', name: 'Australian Dollar / USD',   price: 0.6520, change24h: -0.30, change7d: -0.8, volume24h: 900_000_000,  marketCap: 0, type: 'forex' },
    ],
    commodity: [
      { id: 'XAUUSD', symbol: 'XAU/USD', name: 'Gold (Troy oz)',    price: 2345.60, change24h: 0.85,  change7d: 1.8,  volume24h: 85_000_000,  marketCap: 14_000_000_000_000, type: 'commodity' },
      { id: 'XAGUSD', symbol: 'XAG/USD', name: 'Silver (Troy oz)',  price: 28.40,   change24h: 1.15,  change7d: 2.5,  volume24h: 34_000_000,  marketCap: 1_300_000_000_000,  type: 'commodity' },
      { id: 'WTIUSD', symbol: 'WTI/USD', name: 'Crude Oil (WTI)',   price: 82.50,   change24h: -1.20, change7d: -2.8, volume24h: 120_000_000, marketCap: 0,                  type: 'commodity' },
      { id: 'BRENT',  symbol: 'BRENT',   name: 'Brent Crude Oil',   price: 86.30,   change24h: -0.9,  change7d: -2.1, volume24h: 95_000_000,  marketCap: 0,                  type: 'commodity' },
    ],
  }

  if (category === 'all') {
    return [...(data.stock || []), ...(data.forex || []), ...(data.commodity || [])]
  }
  return data[category] ?? []
}
