// lib/utils.ts

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  highPrecision = false
): string {
  if (isNaN(value)) return '$0.00'

  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (highPrecision || absValue < 1) {
    // Para cryptos pequeños o forex
    if (absValue < 0.0001) return sign + '$' + absValue.toFixed(8)
    if (absValue < 0.01)   return sign + '$' + absValue.toFixed(6)
    if (absValue < 1)      return sign + '$' + absValue.toFixed(4)
    if (absValue < 10)     return sign + '$' + absValue.toFixed(4)
    if (absValue < 1000)   return sign + '$' + absValue.toFixed(2)
  }

  if (absValue >= 1_000_000_000) return sign + '$' + (absValue / 1_000_000_000).toFixed(2) + 'B'
  if (absValue >= 1_000_000)     return sign + '$' + (absValue / 1_000_000).toFixed(2) + 'M'

  return sign + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(value))
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatVolume(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'Just now'
}
