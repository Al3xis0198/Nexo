'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, RefreshCw } from 'lucide-react'
import { formatCurrency, formatPercentage, cn } from '@/lib/utils'
import AssetIcon from '@/components/ui/AssetIcon'

type SortKey = 'price' | 'change24h' | 'volume24h' | 'marketCap'
type SortDir = 'asc' | 'desc'

type MarketItem = {
  id: string; symbol: string; name: string; price: number
  change24h: number; change7d: number; volume24h: number; marketCap: number; type: string
  image?: string
}

interface SortHeaderProps {
  col: SortKey
  label: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (col: SortKey) => void
}

function SortHeader({ col, label, sortKey, sortDir, onSort }: SortHeaderProps) {
  return (
    <th className="text-right cursor-pointer select-none" onClick={() => onSort(col)}>
      <span className="flex items-center justify-end gap-1">
        {label}
        <span style={{ opacity: sortKey === col ? 1 : 0.3 }}>
          {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '▼'}
        </span>
      </span>
    </th>
  )
}

const TABS = [
  { id: 'crypto',    label: 'Crypto' },
  { id: 'stock',     label: 'Stocks' },
  { id: 'forex',     label: 'Forex' },
  { id: 'commodity', label: 'Commodities' },
]

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState('crypto')
  const [search, setSearch]       = useState('')
  const [markets, setMarkets]     = useState<MarketItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [sortKey, setSortKey]     = useState<SortKey>('marketCap')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchMarkets = useCallback(async (category: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/markets?category=${category}`)
      if (res.ok) {
        const data = await res.json()
        setMarkets(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('[Markets]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarkets(activeTab)
    }, 0)
    return () => clearTimeout(timer)
  }, [activeTab, fetchMarkets])

  // Auto-refresh cada 15 segundos
  useEffect(() => {
    const id = setInterval(() => fetchMarkets(activeTab), 15_000)
    return () => clearInterval(id)
  }, [activeTab, fetchMarkets])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = markets
    .filter(m => {
      const q = search.toLowerCase()
      return m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      return ((a[sortKey] ?? 0) - (b[sortKey] ?? 0)) * mul
    })

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Markets
            <span className="live-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--bull)', boxShadow: '0 0 6px var(--bull)' }} />
          </h1>
          <p className="page-subtitle">
            Live prices · <span suppressHydrationWarning>Updated {lastUpdated.toLocaleTimeString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search symbol or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => fetchMarkets(activeTab)}
            className="btn btn-ghost flex items-center gap-2">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] w-fit mb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch('') }}
            className={cn(
              "px-5 py-2 text-sm font-semibold rounded-lg transition-all",
              activeTab === tab.id 
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]" 
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden hover:border-[var(--border-focus)] transition-all duration-300">
        <div className="table-wrapper border-0 rounded-none" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <table className="table w-full">
            <thead className="sticky top-0" style={{ zIndex: 1 }}>
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">Asset</th>
                <SortHeader col="price" label="Price" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="change24h" label="24h %" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="text-right hidden md:table-cell">7d %</th>
                <SortHeader col="volume24h" label="Volume 24h" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader col="marketCap" label="Market Cap" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}>
                          <div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-tertiary)', width: j === 1 ? 120 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                        No results for &quot;{search}&quot;
                      </td>
                    </tr>
                  )
                  : filtered.map((m, idx) => (
                    <tr key={m.id} className="group">
                      <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <AssetIcon symbol={m.symbol} size={28} imageUrl={m.image} />
                          <div>
                            <div className="font-bold text-sm">{m.symbol}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.name}</div>
                          </div>
                          <span className="badge badge-neutral text-[9px] px-1 py-0">{m.type}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono font-bold">{formatCurrency(m.price, m.type === 'crypto' || m.price < 10)}</td>
                      <td className="text-right">
                        <span className={`font-mono font-bold text-sm ${m.change24h >= 0 ? 'text-bull' : 'text-bear'}`}>
                          {m.change24h >= 0 ? '▲' : '▼'} {Math.abs(m.change24h).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right hidden md:table-cell">
                        <span className={`font-mono text-sm ${(m.change7d ?? 0) >= 0 ? 'text-bull' : 'text-bear'}`}>
                          {(m.change7d ?? 0) >= 0 ? '+' : ''}{(m.change7d ?? 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-right font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        ${m.volume24h >= 1e9 ? (m.volume24h / 1e9).toFixed(2) + 'B' : (m.volume24h / 1e6).toFixed(1) + 'M'}
                      </td>
                      <td className="text-right font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {m.marketCap > 0 ? `$${(m.marketCap / 1e9).toFixed(2)}B` : '—'}
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/trade/${m.symbol.replace('/', '-')}-${m.type === 'crypto' ? 'USD' : ''}`}
                          className="btn btn-sm btn-accent-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Trade
                        </Link>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
