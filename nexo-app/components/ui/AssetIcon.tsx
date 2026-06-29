'use client'

// Crypto & Asset Icon Component — íconos de marca reales, tamaño consistente

import React from 'react'

const CRYPTO_COLORS: Record<string, { bg: string; text: string; symbol: string }> = {
  BTC:   { bg: '#F7931A', text: '#fff', symbol: '₿' },
  ETH:   { bg: '#627EEA', text: '#fff', symbol: 'Ξ' },
  BNB:   { bg: '#F3BA2F', text: '#000', symbol: 'B' },
  SOL:   { bg: '#9945FF', text: '#fff', symbol: '◎' },
  XRP:   { bg: '#00AAE4', text: '#fff', symbol: 'X' },
  DOGE:  { bg: '#C2A633', text: '#fff', symbol: 'Ð' },
  ADA:   { bg: '#0033AD', text: '#fff', symbol: '₳' },
  AVAX:  { bg: '#E84142', text: '#fff', symbol: 'A' },
  MATIC: { bg: '#8247E5', text: '#fff', symbol: 'M' },
  DOT:   { bg: '#E6007A', text: '#fff', symbol: '·' },
  LINK:  { bg: '#2A5ADA', text: '#fff', symbol: 'L' },
  UNI:   { bg: '#FF007A', text: '#fff', symbol: '🦄' },
  LTC:   { bg: '#BFBBBB', text: '#000', symbol: 'Ł' },
  ATOM:  { bg: '#2E3148', text: '#fff', symbol: '⚛' },
  TRX:   { bg: '#EF0027', text: '#fff', symbol: 'T' },
  // Stocks
  AAPL:  { bg: '#555', text: '#fff', symbol: '' },
  TSLA:  { bg: '#CC0000', text: '#fff', symbol: '⚡' },
  NVDA:  { bg: '#76B900', text: '#fff', symbol: 'N' },
  MSFT:  { bg: '#00A4EF', text: '#fff', symbol: '⊞' },
  AMZN:  { bg: '#FF9900', text: '#000', symbol: 'a' },
  GOOGL: { bg: '#4285F4', text: '#fff', symbol: 'G' },
  META:  { bg: '#0866FF', text: '#fff', symbol: 'M' },
  NFLX:  { bg: '#E50914', text: '#fff', symbol: 'N' },
  // Forex
  'EUR/USD': { bg: '#003399', text: '#FFD700', symbol: '€' },
  'GBP/USD': { bg: '#00247D', text: '#CF142B', symbol: '£' },
  'USD/JPY': { bg: '#BC002D', text: '#fff', symbol: '¥' },
  'AUD/USD': { bg: '#00843D', text: '#fff', symbol: 'A$' },
  EURUSD:    { bg: '#003399', text: '#FFD700', symbol: '€' },
  GBPUSD:    { bg: '#00247D', text: '#CF142B', symbol: '£' },
  USDJPY:    { bg: '#BC002D', text: '#fff', symbol: '¥' },
  AUDUSD:    { bg: '#00843D', text: '#fff', symbol: 'A$' },
  // Commodities
  'XAU/USD': { bg: '#D4AF37', text: '#000', symbol: 'Au' },
  'XAG/USD': { bg: '#C0C0C0', text: '#000', symbol: 'Ag' },
  'WTI/USD': { bg: '#2C2C2C', text: '#F0B90B', symbol: '⛽' },
  XAUUSD:    { bg: '#D4AF37', text: '#000', symbol: 'Au' },
  XAGUSD:    { bg: '#C0C0C0', text: '#000', symbol: 'Ag' },
  WTIUSD:    { bg: '#2C2C2C', text: '#F0B90B', symbol: '⛽' },
  BRENT:     { bg: '#1a1a2e', text: '#F0B90B', symbol: 'Br' },
}

interface AssetIconProps {
  symbol: string
  size?: number
  imageUrl?: string | null
  className?: string
}

export default function AssetIcon({ symbol, size = 28, imageUrl, className = '' }: AssetIconProps) {
  const clean = symbol.replace('/', '').toUpperCase()
  const config = CRYPTO_COLORS[symbol] ?? CRYPTO_COLORS[clean] ?? null

  // Si hay URL de imagen (CoinGecko), usar imagen real pero pequeña
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={symbol}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  const bg   = config?.bg   ?? '#2B3139'
  const text = config?.text ?? '#EAECEF'
  const sym  = config?.symbol ?? symbol.slice(0, 2)

  const fontSize = size <= 20 ? size * 0.42 : size * 0.38

  return (
    <div
      className={`flex-center rounded-full shrink-0 font-bold select-none ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: bg,
        color: text,
        fontSize,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
      title={symbol}
    >
      {sym}
    </div>
  )
}
