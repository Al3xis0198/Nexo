'use client';
import React from 'react';
import { ArrowRight, BarChart2 } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 100px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Background image ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}>
        <img
          src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2400&auto=format&fit=crop"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            opacity: 0.22,
            filter: 'saturate(0.7) brightness(0.6)',
            transform: 'scale(1.04)',
          }}
        />
        {/* Multi-layer gradient overlay for text legibility */}
        {/* Dark vignette from edges */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(11,14,17,0.3) 0%, rgba(11,14,17,0.75) 55%, rgba(11,14,17,0.97) 100%)',
        }} />
        {/* Strong dark top (behind header) */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(11,14,17,0.85), transparent)',
        }} />
        {/* Strong dark bottom (into next section) */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '45%',
          background: 'linear-gradient(to top, #0B0E11 0%, rgba(11,14,17,0.6) 60%, transparent 100%)',
        }} />
        {/* Subtle golden tint overlay for brand cohesion */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(240,185,11,0.07) 0%, transparent 60%)',
        }} />
      </div>

      {/* ── Ambient glow orbs on top of image ── */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 900,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(240,185,11,0.12) 0%, rgba(14,203,129,0.04) 45%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      {/* ── Content centered ── */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 24,
        maxWidth: 860,
        width: '100%',
      }}>
        {/* Badge */}
        <a
          href="/register"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 16px 6px 6px',
            borderRadius: 999,
            border: '1px solid rgba(240,185,11,0.25)',
            background: 'rgba(240,185,11,0.07)',
            backdropFilter: 'blur(16px)',
            textDecoration: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(240,185,11,0.08)',
          }}
        >
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
            padding: '3px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}>NEW</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>Zero fees on your first deposit</span>
          <ArrowRight size={13} color="rgba(255,255,255,0.5)" />
        </a>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6.5vw, 5rem)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          color: '#EAECEF',
          margin: 0,
          textShadow: '0 2px 40px rgba(0,0,0,0.8)',
        }}>
          The Professional Platform for{' '}
          <span style={{
            background: 'linear-gradient(135deg, #F0B90B 0%, #F3BA2F 50%, #FFCF40 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Crypto Trading
          </span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: 'clamp(1rem, 1.6vw, 1.2rem)',
          color: 'rgba(234,236,239,0.70)',
          maxWidth: 580,
          lineHeight: 1.7,
          margin: 0,
          fontWeight: 400,
          textShadow: '0 1px 12px rgba(0,0,0,0.7)',
        }}>
          Trade Bitcoin, Ethereum, and 350+ crypto assets with institutional-grade security, deep liquidity, and professional trading tools.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 8,
        }}>
          <a
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '15px 36px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
              color: '#000',
              fontWeight: 800,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 0 40px rgba(240,185,11,0.4), 0 4px 20px rgba(0,0,0,0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(240,185,11,0.6), 0 8px 30px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(240,185,11,0.4), 0 4px 20px rgba(0,0,0,0.5)';
            }}
          >
            Start Trading <ArrowRight size={16} />
          </a>
          <a
            href="/markets"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '15px 36px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              color: '#EAECEF',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.28)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
            }}
          >
            <BarChart2 size={16} style={{ opacity: 0.8 }} /> View Markets
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <div style={{ display: 'flex' }}>
            {[
              { color: '#F7931A', initial: 'A' },
              { color: '#627EEA', initial: 'M' },
              { color: '#9945FF', initial: 'S' },
              { color: '#F3BA2F', initial: 'C' },
              { color: '#E84142', initial: 'L' },
            ].map((avatar, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: avatar.color,
                border: '2px solid #0B0E11',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                marginLeft: i === 0 ? 0 : -10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}>{avatar.initial}</div>
            ))}
          </div>
          <span style={{ fontSize: '0.82rem', color: 'rgba(234,236,239,0.6)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            Trusted by <strong style={{ color: '#F0B90B' }}>2M+</strong> traders worldwide
          </span>
        </div>

        {/* Live stats strip */}
        <div style={{
          display: 'flex',
          gap: 0,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 16,
          borderRadius: 14,
          background: 'rgba(11,14,17,0.65)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {[
            { label: 'BTC / USD', value: '$64,520', color: '#0ECB81', change: '▲ 2.45%' },
            { label: 'ETH / USD', value: '$3,450', color: '#0ECB81', change: '▲ 1.12%' },
            { label: '24h Volume', value: '$14.2B', color: '#F0B90B', change: 'Global' },
            { label: 'Active Traders', value: '2M+', color: '#EAECEF', change: 'Worldwide' },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: '14px 28px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: stat.color, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{stat.value}</div>
              <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>{stat.change}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
