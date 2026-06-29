'use client';
import React from 'react';
import Link from 'next/link';
import NexoLogo from '@/components/ui/NexoLogo';
import {
  BarChart, LineChart, Wallet, CodeIcon, LayersIcon, UserPlusIcon,
  Users, Star, FileText, ShieldCheck, HelpCircle, Menu, X, ChevronDown,
} from 'lucide-react';

const NAV_TRADE = [
  { label: 'Spot Trading', href: '/trade/BTC-USD', sub: 'Trade crypto instantly', icon: LineChart },
  { label: 'Futures', href: '/register', sub: 'Up to 100x leverage', icon: BarChart },
  { label: 'Copy Trading', href: '/register', sub: 'Follow top traders', icon: UserPlusIcon },
  { label: 'Web3 Wallet', href: '/register', sub: 'Store your assets', icon: Wallet },
  { label: 'Staking', href: '/register', sub: 'Earn yield on crypto', icon: LayersIcon },
  { label: 'API', href: '/register', sub: 'Automate trading bots', icon: CodeIcon },
];

const NAV_LEARN = [
  { label: 'About NexoTrading', href: '#', sub: 'Our mission and security', icon: Users },
  { label: 'VIP Program', href: '#', sub: 'Exclusive high-volume perks', icon: Star },
  { label: 'Fees & Limits', href: '#', icon: FileText },
  { label: 'Security', href: '#', icon: ShieldCheck },
  { label: 'Help Center', href: '#', icon: HelpCircle },
];

export function Header() {
  const [open, setOpen] = React.useState(false);
  const [dropdown, setDropdown] = React.useState<'trade' | 'learn' | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    width: '100%',
    transition: 'all 0.3s ease',
    background: scrolled ? 'rgba(11,14,17,0.85)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
    boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.3)' : 'none',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
  };

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <NexoLogo size={32} />
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#EAECEF', letterSpacing: '-0.01em' }}>
            Nexo<span style={{ color: '#F0B90B' }}>Trading</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {/* Trade dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setDropdown('trade')}
            onMouseLeave={() => setDropdown(null)}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: dropdown === 'trade' ? '#F0B90B' : '#EAECEF',
              fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s',
            }}>
              Trade <ChevronDown size={14} style={{ opacity: 0.7, transform: dropdown === 'trade' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {dropdown === 'trade' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: 'rgba(11,14,17,0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 12,
                padding: 12,
                minWidth: 380,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
              }}>
                {NAV_TRADE.map(item => (
                  <a key={item.label} href={item.href} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                    borderRadius: 8, textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <item.icon size={16} color="#848E9C" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EAECEF' }}>{item.label}</div>
                      <div style={{ fontSize: '0.73rem', color: '#848E9C', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Learn dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={() => setDropdown('learn')}
            onMouseLeave={() => setDropdown(null)}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: dropdown === 'learn' ? '#F0B90B' : '#EAECEF',
              fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s',
            }}>
              Learn &amp; Earn <ChevronDown size={14} style={{ opacity: 0.7, transform: dropdown === 'learn' ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            {dropdown === 'learn' && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: 'rgba(11,14,17,0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 12,
                padding: 12,
                minWidth: 240,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}>
                {NAV_LEARN.map(item => (
                  <a key={item.label} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    borderRadius: 8, textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <item.icon size={15} color="#848E9C" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#EAECEF' }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: '0.72rem', color: '#848E9C', marginTop: 1 }}>{item.sub}</div>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a href="/markets" style={{
            padding: '8px 14px', textDecoration: 'none',
            color: '#EAECEF', fontSize: '0.9rem', fontWeight: 600,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0B90B'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#EAECEF'}
          >Markets</a>
        </div>

        {/* Desktop auth buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="desktop-nav">
          <a href="/login" style={{
            padding: '9px 20px', borderRadius: 8, textDecoration: 'none',
            color: '#EAECEF', fontSize: '0.9rem', fontWeight: 700,
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >Log In</a>
          <a href="/register" style={{
            padding: '9px 22px', borderRadius: 8, textDecoration: 'none',
            background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
            color: '#000', fontSize: '0.9rem', fontWeight: 800,
            boxShadow: '0 0 20px rgba(240,185,11,0.25)',
            transition: 'opacity 0.2s, transform 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
          >Sign Up</a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="mobile-menu-btn"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#EAECEF', padding: 8, borderRadius: 8,
          }}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(11,14,17,0.97)',
          backdropFilter: 'blur(24px)',
          zIndex: 40,
          overflowY: 'auto',
          padding: '20px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5E6673', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '8px 0 4px' }}>Trade</div>
          {NAV_TRADE.map(item => (
            <a key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 10, textDecoration: 'none', background: 'rgba(255,255,255,0.04)',
            }}
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} color="#848E9C" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#EAECEF' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#848E9C' }}>{item.sub}</div>
              </div>
            </a>
          ))}
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5E6673', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '16px 0 4px' }}>Learn &amp; Earn</div>
          {NAV_LEARN.map(item => (
            <a key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 10, textDecoration: 'none', background: 'rgba(255,255,255,0.04)',
            }}
              onClick={() => setOpen(false)}
            >
              <item.icon size={18} color="#848E9C" />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#EAECEF' }}>{item.label}</div>
            </a>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="/login" style={{
              display: 'block', padding: '14px', borderRadius: 10, textAlign: 'center',
              textDecoration: 'none', color: '#EAECEF', fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
            }}>Log In</a>
            <a href="/register" style={{
              display: 'block', padding: '14px', borderRadius: 10, textAlign: 'center',
              textDecoration: 'none', color: '#000', fontWeight: 800,
              background: 'linear-gradient(135deg, #F0B90B, #F3BA2F)',
            }}>Sign Up — Free</a>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
        @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } }
      `}</style>
    </header>
  );
}
