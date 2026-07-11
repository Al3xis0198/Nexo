import { useState, useEffect, useRef, useCallback } from 'react';
import type { Candle } from '../analysis/indicators';
import type { Timeframe } from '@/components/charts/TradingChart';

// Mapea nuestros timeframes a los de Binance
export const BINANCE_INTERVALS: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
};

/**
 * Normaliza un símbolo para Binance
 * Ej: "BTC/USD" -> "BTCUSDT", "ETH/USD" -> "ETHUSDT"
 * Si no es crypto conocida, hace fallback a "BTCUSDT"
 */
function normalizeSymbolForBinance(symbol: string): string {
  if (!symbol) return 'BTCUSDT';
  
  // Binance no tiene pares /USD puros para todo, usa USDT
  let clean = symbol.replace(/[\/\-]/g, '').toUpperCase();
  if (clean.endsWith('USD')) {
    clean = clean.substring(0, clean.length - 3) + 'USDT';
  }
  
  // Lista básica de pares soportados para evitar errores
  const supported = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT'];
  if (!supported.includes(clean)) {
    return 'BTCUSDT'; // Fallback seguro
  }
  return clean;
}

export function useBinanceMarket(symbol: string, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const binanceSymbol = normalizeSymbolForBinance(symbol);
  const interval = BINANCE_INTERVALS[timeframe];

  // 1. Fetch histórico inicial
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=1000`);
      if (!res.ok) throw new Error('Binance API error');
      
      const data = await res.json();
      
      // Formato de Binance:
      // [0: Open time, 1: Open, 2: High, 3: Low, 4: Close, 5: Volume, 6: Close time, ...]
      const formattedCandles: Candle[] = data.map((k: any) => ({
        time: (k[0] / 1000) as any, // Lightweight charts needs seconds
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setCurrentPrice(formattedCandles[formattedCandles.length - 1].close);
      }
    } catch (err) {
      console.error('Error fetching Binance history:', err);
    } finally {
      setLoading(false);
    }
  }, [binanceSymbol, interval]);

  // 2. Conectar WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const t = setTimeout(() => fetchHistory(), 0);

    const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.e === 'kline') {
        const k = msg.k;
        const newCandle: Candle & { volume: number } = {
          time: (k.t / 1000) as any,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };

        setCurrentPrice(newCandle.close);

        setCandles(prev => {
          if (prev.length === 0) return [newCandle];
          const lastCandle = prev[prev.length - 1];
          
          if ((newCandle.time as number) === (lastCandle.time as number)) {
            // Update current candle
            return [...prev.slice(0, -1), newCandle];
          } else if ((newCandle.time as number) > (lastCandle.time as number)) {
            // Add new candle
            return [...prev, newCandle];
          }
          return prev;
        });
      }
    };

    return () => {
      clearTimeout(t);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchHistory, binanceSymbol, interval]);

  return { candles, currentPrice, loading };
}

/**
 * Hook ligero solo para obtener precio en tiempo real, 
 * útil para páginas como binarias donde el gráfico no es lo principal,
 * pero sí la acción del precio a cada tick (1s).
 */
export function useBinanceLivePrice(symbol: string) {
  const [price, setPrice] = useState(0);
  const binanceSymbol = normalizeSymbolForBinance(symbol);

  useEffect(() => {
    // Primero, un fetch para no empezar en 0
    fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.price) setPrice(parseFloat(data.price));
      })
      .catch(console.error);

    // Luego nos conectamos al aggTrade stream que es hiper rápido (cada vez que hay un trade real)
    const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@aggTrade`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.e === 'aggTrade') {
        setPrice(parseFloat(msg.p));
      }
    };

    return () => ws.close();
  }, [binanceSymbol]);

  return price;
}
