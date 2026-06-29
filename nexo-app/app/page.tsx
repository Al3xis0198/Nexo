'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Shield, Zap, BarChart2, Globe } from 'lucide-react'
import NexoLogo from '@/components/ui/NexoLogo'
import AssetIcon from '@/components/ui/AssetIcon'
import { useLang } from '@/contexts/LangContext'
import { Header } from '@/components/ui/header-3'
import { HeroSection } from '@/components/ui/hero-3'

const TAPE_ITEMS = [
  { symbol: 'BTC/USD', price: '$64,520', change: '+2.45%', up: true },
  { symbol: 'ETH/USD', price: '$3,450', change: '+1.12%', up: true },
  { symbol: 'BNB/USD', price: '$590', change: '-0.50%', up: false },
  { symbol: 'SOL/USD', price: '$145', change: '-4.20%', up: false },
  { symbol: 'DOGE/USD',price: '$0.152', change: '+6.20%', up: true },
  { symbol: 'AAPL',    price: '$189.45', change: '+1.20%', up: true },
  { symbol: 'NVDA',    price: '$890.10', change: '+4.47%', up: true },
  { symbol: 'XAU/USD', price: '$2,345', change: '+0.85%', up: true },
  { symbol: 'EUR/USD', price: '$1.0854', change: '-0.15%', up: false },
  { symbol: 'WTI/USD', price: '$82.50', change: '-1.20%', up: false },
]

const FEATURE_KEYS = [
  { icon: Zap,      color: '#F0B90B', bg: 'rgba(240,185,11,0.1)',  titleKey: 'feat.f1.title', descKey: 'feat.f1.desc' },
  { icon: BarChart2,color: '#0ECB81', bg: 'rgba(14,203,129,0.1)', titleKey: 'feat.f2.title', descKey: 'feat.f2.desc' },
  { icon: Shield,   color: '#1890FF', bg: 'rgba(24,144,255,0.1)', titleKey: 'feat.f3.title', descKey: 'feat.f3.desc' },
  { icon: Globe,    color: '#9945FF', bg: 'rgba(153,69,255,0.1)', titleKey: 'feat.f4.title', descKey: 'feat.f4.desc' },
]

const STAT_KEYS = [
  { value: '2M+',   labelKey: 'stats.traders' },
  { value: '$14B',  labelKey: 'stats.volume'  },
  { value: '350+',  labelKey: 'stats.markets' },
  { value: '99.9%', labelKey: 'stats.uptime'  },
]

const MARKETS_DATA = [
  { symbol: 'BTC', name: 'Bitcoin',   price: 64520.10, c24: +2.45, c7: +5.2,  vol: '$35.2B' },
  { symbol: 'ETH', name: 'Ethereum',  price: 3450.80,  c24: +1.12, c7: +3.8,  vol: '$15.1B' },
  { symbol: 'BNB', name: 'BNB',       price: 590.25,   c24: -0.50, c7: -1.2,  vol: '$1.2B'  },
  { symbol: 'SOL', name: 'Solana',    price: 145.30,   c24: -4.20, c7: -8.5,  vol: '$2.8B'  },
  { symbol: 'DOGE',name: 'Dogecoin',  price: 0.152,    c24: +6.20, c7: +12.4, vol: '$1.8B'  },
  { symbol: 'AVAX',name: 'Avalanche', price: 36.40,    c24: +3.50, c7: +8.2,  vol: '$550M'  },
]

export default function LandingPage() {
  const { t } = useLang()

  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh', color: '#EAECEF', fontFamily: 'Inter, -apple-system, sans-serif', overflowX: 'hidden' }}>

      <Header />

      {/* TICKER TAPE */}
      <div style={{ background: '#13161A', borderBottom: '1px solid rgba(43,49,57,0.5)', height: 34, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', gap: 40, animation: 'ticker-scroll 55s linear infinite', padding: '0 16px', whiteSpace: 'nowrap' }}>
          {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
              <span style={{ color: '#848E9C' }}>{item.symbol}</span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#EAECEF' }}>{item.price}</span>
              <span style={{ fontWeight: 700, fontSize: '0.73rem', color: item.up ? '#0ECB81' : '#F6465D' }}>
                {item.up ? '▲' : '▼'} {item.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      <HeroSection />

      {/* STATS BAR */}
      <section style={{ background: '#13161A', borderTop: '1px solid rgba(43,49,57,0.5)', borderBottom: '1px solid rgba(43,49,57,0.5)', padding: '32px max(24px, (100% - 1200px) / 2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STAT_KEYS.map(({ value, labelKey }) => (
            <div key={labelKey} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{value}</div>
              <div style={{ fontSize: '0.83rem', color: '#848E9C', marginTop: 4 }}>{t(labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '96px max(24px, (100% - 1200px) / 2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{t('feat.why')}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, color: '#EAECEF' }}>
            {t('feat.h2')}
          </h2>
          <p style={{ color: '#848E9C', fontSize: '1rem', maxWidth: 480, margin: '0 auto' }}>
            {t('feat.sub')}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURE_KEYS.map(({ icon: Icon, color, bg, titleKey, descKey }) => (
            <div key={titleKey} style={{
              display: 'flex', flexDirection: 'column', padding: '28px',
              borderRadius: 16, background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)', transition: 'transform 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color }}>
                <Icon size={24} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: '#EAECEF' }}>{t(titleKey)}</h3>
              <p style={{ color: '#848E9C', fontSize: '0.88rem', lineHeight: 1.65 }}>{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS PREVIEW */}
      <section style={{ padding: '0 max(24px, (100% - 1200px) / 2) 96px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#EAECEF' }}>{t('mkt.title')}</h2>
              <p style={{ color: '#848E9C', fontSize: '0.8rem', marginTop: 2 }}>{t('mkt.sub')}</p>
            </div>
            <Link href="/markets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#F0B90B', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              {t('mkt.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(43,49,57,0.5)' }}>
                  {[
                    { k: 'mkt.th.asset', left: true },
                    { k: 'mkt.th.price', left: false },
                    { k: 'mkt.th.24h',   left: false },
                    { k: 'mkt.th.7d',    left: false },
                    { k: 'mkt.th.vol',   left: false },
                  ].map(({ k, left }) => (
                    <th key={k} style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255,255,255,0.03)', textAlign: left ? 'left' : 'right' }}>
                      {t(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARKETS_DATA.map((m, idx) => (
                  <tr key={m.symbol}
                    style={{ borderBottom: '1px solid rgba(43,49,57,0.4)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => window.location.href = `/trade/${m.symbol}-USD`}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.75rem', color: '#5E6673', width: 16, textAlign: 'right' }}>{idx + 1}</span>
                        <AssetIcon symbol={m.symbol} size={30} imageUrl={null} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#EAECEF' }}>{m.symbol}</div>
                          <div style={{ fontSize: '0.73rem', color: '#848E9C' }}>{m.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#EAECEF' }}>
                      ${m.price > 1 ? m.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : m.price.toFixed(4)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: m.c24 >= 0 ? '#0ECB81' : '#F6465D' }}>
                        {m.c24 >= 0 ? '▲' : '▼'} {Math.abs(m.c24).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: m.c7 >= 0 ? '#0ECB81' : '#F6465D' }}>
                        {m.c7 >= 0 ? '+' : ''}{m.c7.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#848E9C', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {m.vol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '0 max(24px, (100% - 1200px) / 2) 96px' }}>
        <div style={{ padding: '64px 48px', borderRadius: 20, textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #1A1D21 0%, #1E2329 100%)', border: '1px solid rgba(240,185,11,0.15)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(240,185,11,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>{t('cta.tag')}</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 16, color: '#EAECEF' }}>{t('cta.h2')}</h2>
            <p style={{ color: '#848E9C', fontSize: '1rem', maxWidth: 420, margin: '0 auto 36px' }}>{t('cta.sub')}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 10, fontSize: '1rem', fontWeight: 700, background: '#F0B90B', color: '#000', textDecoration: 'none', boxShadow: '0 0 30px rgba(240,185,11,0.25)' }}>
                {t('cta.btn1')} <ArrowRight size={18} />
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', padding: '15px 32px', borderRadius: 10, fontSize: '1rem', fontWeight: 600, background: 'transparent', color: '#EAECEF', textDecoration: 'none', border: '1px solid rgba(132,142,156,0.3)' }}>
                {t('cta.btn2')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0D1017', borderTop: '1px solid rgba(43,49,57,0.6)', padding: '72px max(24px, (100% - 1200px) / 2) 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '48px 32px', paddingBottom: 64 }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <NexoLogo size={34} />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#EAECEF' }}>Nexo<span style={{ color: '#F0B90B' }}>Trading</span></span>
            </Link>
            <p style={{ color: '#5E6673', fontSize: '0.83rem', lineHeight: 1.7, maxWidth: 220, marginBottom: 24 }}>
              The professional trading platform for crypto, stocks, forex and commodities.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {['X', 'TG', 'DC', 'YT'].map(icon => (
                <a key={icon} href="#" style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(43,49,57,0.6)', border: '1px solid rgba(43,49,57,0.9)', color: '#848E9C', fontSize: '0.62rem', fontWeight: 700, textDecoration: 'none' }}>{icon}</a>
              ))}
            </div>
          </div>
          {[
            { title: 'Product', links: [{ label: 'Markets', href: '/markets' }, { label: 'Trade', href: '/trade/BTC-USD' }, { label: 'Portfolio', href: '/register' }, { label: 'Wallet', href: '/register' }] },
            { title: 'Company', links: [{ label: 'About Us', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }, { label: 'Contact', href: '#' }] },
            { title: 'Legal', links: [{ label: 'Terms of Service', href: '#' }, { label: 'Privacy Policy', href: '#' }, { label: 'Risk Disclaimer', href: '#' }, { label: 'Help Center', href: '#' }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(l => (
                  <Link key={l.label} href={l.href} style={{ fontSize: '0.85rem', color: '#848E9C', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EAECEF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#848E9C'}
                  >{l.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(43,49,57,0.8), transparent)', marginBottom: 28 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingBottom: 32 }}>
          <div style={{ fontSize: '0.78rem', color: '#5E6673' }}>© 2026 NexoTrading Global LLC. All rights reserved.</div>
          <div style={{ fontSize: '0.75rem', color: '#5E6673' }}>Trading involves risk. Capital may be lost.</div>
        </div>
      </footer>

      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}
