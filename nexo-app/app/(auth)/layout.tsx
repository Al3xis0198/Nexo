'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Zap, BarChart2, TrendingUp, Loader2 } from 'lucide-react'
import NexoLogo from '@/components/ui/NexoLogo'
import AssetIcon from '@/components/ui/AssetIcon'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LIVE_PRICES = [
  { symbol: 'BTC', price: '$64,520', change: '+2.45%', up: true },
  { symbol: 'ETH', price: '$3,450',  change: '+1.12%', up: true },
  { symbol: 'SOL', price: '$145.30', change: '-4.20%', up: false },
  { symbol: 'BNB', price: '$590.25', change: '-0.50%', up: false },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

      {/* ─── LEFT: Form ─── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 64px)', position: 'relative', zIndex: 1, minWidth: 0 }}>
        <div style={{ width: '100%', maxWidth: 420 }} className="animate-slide-up">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-10">
            <NexoLogo size={40} />
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-xl tracking-tight">
                Nexo<span style={{ color: 'var(--accent)' }}>Trading</span>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Professional Trading Platform
              </span>
            </div>
          </Link>

          {children}
        </div>
      </div>

      {/* ─── RIGHT: Premium promo panel ─── */}
      <div style={{ flex: 1, display: 'none', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }} className="auth-panel-right">
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(43,49,57,0.6) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 360, height: 360, background: 'rgba(240,185,11,0.1)', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '0%', width: 300, height: 300, background: 'rgba(14,203,129,0.07)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div className="relative z-10 flex flex-col gap-6" style={{ maxWidth: 420, padding: '36px', background: 'rgba(26,29,33,0.75)', backdropFilter: 'blur(24px)', border: '1px solid rgba(43,49,57,0.8)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Trade with<br />
              <span style={{ color: 'var(--accent)' }}>Confidence</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Join 2M+ professional traders. Real-time signals, advanced charts, and deep liquidity — all in one platform.
            </p>
          </div>

          {/* Live Prices */}
          <div style={{ background: 'rgba(11,14,17,0.5)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(43,49,57,0.6)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', display: 'inline-block', boxShadow: '0 0 5px var(--bull)' }} />
              Live Prices
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LIVE_PRICES.map(p => (
                <div key={p.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AssetIcon symbol={p.symbol} size={24} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.symbol}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem' }}>{p.price}</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: p.up ? 'var(--bull)' : 'var(--bear)' }}>
                      {p.up ? '▲' : '▼'} {p.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          {[
            { icon: Zap, color: 'var(--bull)', bg: 'var(--bull-dim)', title: 'Lightning Execution', desc: 'Sub-ms order processing, zero slippage.' },
            { icon: Shield, color: 'var(--accent)', bg: 'var(--accent-dim)', title: 'Bank-Grade Security', desc: '2FA, cold storage, real-time monitoring.' },
            { icon: TrendingUp, color: '#1890FF', bg: 'rgba(24,144,255,0.12)', title: 'Smart Signals', desc: 'RSI, EMA, MACD auto-analysis on every chart.' },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {[{ v: '2M+', l: 'Users' }, { v: '350+', l: 'Pairs' }, { v: '$14B', l: '24h Vol' }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent)', fontFamily: 'monospace' }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-panel-right { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
