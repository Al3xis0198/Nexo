'use client'

import Link from 'next/link'
import NexoLogo from '@/components/ui/NexoLogo'

const S = {
  page: { background: '#0B0E11', minHeight: '100vh', color: '#EAECEF', fontFamily: 'Inter, sans-serif' } as React.CSSProperties,
  nav: { position: 'sticky' as const, top: 0, zIndex: 50, background: 'rgba(11,14,17,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(43,49,57,0.5)', padding: '0 max(24px, (100% - 1100px) / 2)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '80px 24px 120px' },
  h1:   { fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 },
  tag:  { display: 'inline-block', background: 'rgba(240,185,11,0.12)', color: '#F0B90B', border: '1px solid rgba(240,185,11,0.25)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 28 },
  sub:  { color: '#848E9C', fontSize: '1.05rem', maxWidth: 600, lineHeight: 1.7, marginBottom: 64 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 64 },
  card: { background: '#13161A', border: '1px solid rgba(43,49,57,0.7)', borderRadius: 16, padding: 32 },
  ch3:  { fontSize: '1.1rem', fontWeight: 700, marginBottom: 10 },
  cp:   { color: '#848E9C', fontSize: '0.9rem', lineHeight: 1.75 },
}

const TEAM = [
  { name: 'Alex Rivera',   role: 'CEO & Co-founder',      initial: 'AR', color: '#F0B90B' },
  { name: 'Sara Chen',     role: 'CTO & Co-founder',      initial: 'SC', color: '#0ECB81' },
  { name: 'Marco Ortega',  role: 'Head of Product',        initial: 'MO', color: '#1890FF' },
  { name: 'Lena Müller',   role: 'Head of Compliance',     initial: 'LM', color: '#9945FF' },
]

const STATS = [
  { value: '2M+',  label: 'Registered traders' },
  { value: '$14B', label: '24h trading volume' },
  { value: '350+', label: 'Assets available' },
  { value: '2019', label: 'Year founded' },
]

export default function AboutPage() {
  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      <nav style={S.nav}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <NexoLogo size={32} />
          <span style={{ fontWeight: 800, color: '#EAECEF' }}>Nexo<span style={{ color: '#F0B90B' }}>Trading</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/login"    style={{ color: '#848E9C', textDecoration: 'none', fontSize: '0.9rem' }}>Sign In</Link>
          <Link href="/register" style={{ background: '#F0B90B', color: '#000', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 700 }}>Get Started</Link>
        </div>
      </nav>

      <div style={S.wrap}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div style={S.tag}>About NexoTrading</div>
          <h1 style={S.h1}>Built for the future<br />of trading</h1>
          <p style={{ ...S.sub, margin: '0 auto 48px' }}>
            NexoTrading is a next-generation trading platform combining institutional-grade tools with an experience accessible to everyone — from first-time traders to seasoned professionals.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F0B90B', fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ color: '#848E9C', fontSize: '0.83rem', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div style={{ background: 'linear-gradient(135deg,#1A1D21,#13161A)', border: '1px solid rgba(240,185,11,0.15)', borderRadius: 20, padding: '48px', marginBottom: 64, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(circle, rgba(240,185,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Our Mission</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 16, maxWidth: 600 }}>Democratizing access to global financial markets</h2>
          <p style={{ color: '#848E9C', lineHeight: 1.8, maxWidth: 680 }}>
            We believe every person deserves access to the same sophisticated tools that institutions use. NexoTrading was founded to break down the barriers of traditional finance and give every trader — regardless of experience or capital — the power to compete on a level playing field.
          </p>
        </div>

        {/* Team */}
        <div id="team" style={{ marginBottom: 64 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F0B90B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Team</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 32 }}>The people behind NexoTrading</h2>
          <div style={S.grid}>
            {TEAM.map(m => (
              <div key={m.name} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${m.color}22`, border: `2px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: m.color, flexShrink: 0 }}>{m.initial}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ color: '#848E9C', fontSize: '0.85rem' }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog / Careers / Press anchors */}
        <div id="blog" style={{ ...S.card, marginBottom: 24 }}>
          <div style={S.ch3}>📝 Blog</div>
          <p style={S.cp}>Our blog is coming soon. Follow us on social media for updates, market analysis, and platform news.</p>
        </div>
        <div id="careers" style={{ ...S.card, marginBottom: 24 }}>
          <div style={S.ch3}>💼 Careers</div>
          <p style={S.cp}>We&apos;re always looking for talented people. Send your resume to <span style={{ color: '#F0B90B' }}>careers@nexotrading.io</span></p>
        </div>
        <div id="press" style={{ ...S.card, marginBottom: 24 }}>
          <div style={S.ch3}>📢 Press</div>
          <p style={S.cp}>For press inquiries contact <span style={{ color: '#F0B90B' }}>press@nexotrading.io</span></p>
        </div>
        <div id="contact" style={S.card}>
          <div style={S.ch3}>📬 Contact</div>
          <p style={S.cp}>Support: <span style={{ color: '#F0B90B' }}>support@nexotrading.io</span> &nbsp;|&nbsp; General: <span style={{ color: '#F0B90B' }}>hello@nexotrading.io</span></p>
        </div>
      </div>
    </div>
  )
}
