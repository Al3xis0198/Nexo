'use client'

import Link from 'next/link'
import NexoLogo from '@/components/ui/NexoLogo'

const NAV = (
  <nav style={{ position: 'sticky' as const, top: 0, zIndex: 50, background: 'rgba(11,14,17,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(43,49,57,0.5)', padding: '0 max(24px, (100% - 1100px) / 2)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      <NexoLogo size={32} />
      <span style={{ fontWeight: 800, color: '#EAECEF' }}>Nexo<span style={{ color: '#F0B90B' }}>Trading</span></span>
    </Link>
    <div style={{ display: 'flex', gap: 16 }}>
      <Link href="/login"    style={{ color: '#848E9C', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
      <Link href="/register" style={{ background: '#F0B90B', color: '#000', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>Get Started</Link>
    </div>
  </nav>
)

const WRAP: React.CSSProperties = { maxWidth: 800, margin: '0 auto', padding: '80px 24px 120px' }
const H1:   React.CSSProperties = { fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }
const TAG:  React.CSSProperties = { display: 'inline-block', background: 'rgba(240,185,11,0.12)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }
const SECTION: React.CSSProperties = { marginBottom: 40 }
const H2: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 700, color: '#EAECEF', marginBottom: 12, marginTop: 36 }
const P:  React.CSSProperties = { color: '#848E9C', lineHeight: 1.8, fontSize: '0.92rem' }

export function LegalPage({ tag, title, updated, children }: { tag: string; title: string; updated: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0B0E11', minHeight: '100vh', color: '#EAECEF', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
      {NAV}
      <div style={WRAP}>
        <div style={TAG}>{tag}</div>
        <h1 style={H1}>{title}</h1>
        <p style={{ color: '#5E6673', fontSize: '0.83rem', marginBottom: 56 }}>Last updated: {updated}</p>
        <div style={{ background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 20, padding: '48px 56px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
          {[
            { label: '← Back to Home',    href: '/' },
            { label: 'Privacy Policy',    href: '/legal/privacy' },
            { label: 'Risk Disclaimer',   href: '/legal/risk' },
            { label: 'Terms of Service',  href: '/legal/terms' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{ color: '#848E9C', textDecoration: 'none', fontSize: '0.85rem', borderBottom: '1px solid rgba(132,142,156,0.2)', paddingBottom: 2 }}>{l.label}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export { SECTION, H2, P }
