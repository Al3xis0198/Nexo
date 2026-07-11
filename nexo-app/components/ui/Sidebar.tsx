'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  TrendingUp,
  PieChart,
  Wallet,
  Settings,
  ShieldAlert,
  ChevronRight,
  HelpCircle,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { cn } from '@/lib/utils'
import NexoLogo from './NexoLogo'

export default function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  const { t, lang, setLang } = useLang()

  const NAV_ITEMS = [
    { name: t('side.dashboard'), href: '/dashboard',    icon: LayoutDashboard, match: '/dashboard' },
    { name: t('side.markets'),   href: '/markets',       icon: BarChart2,       match: '/markets'   },
    { name: t('side.trade'),     href: '/trade/BTC-USD', icon: TrendingUp,      match: '/trade'     },
    { name: 'Trading Binario',   href: '/binary',        icon: Zap,             match: '/binary', badge: 'NUEVO' },
    { name: t('side.portfolio'), href: '/portfolio',     icon: PieChart,        match: '/portfolio' },
    { name: t('side.wallet'),    href: '/wallet',        icon: Wallet,          match: '/wallet'    },
  ]


  return (
    <aside
      className="h-full hidden md:flex flex-col shrink-0"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        userSelect: 'none',
      }}
    >
      {/* ─── Logo ─── */}
      <div
        className="flex items-center px-5 shrink-0"
        style={{ height: 'var(--navbar-height)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <NexoLogo size={32} />
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-[1rem] tracking-tight text-[var(--text-primary)]">
              Nexo<span className="text-[var(--accent)]">Trading</span>
            </span>
          </div>
        </Link>
      </div>

      {/* ─── Nav ─── */}
      <div className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-0.5">

        <div className="text-[10px] font-bold uppercase tracking-widest mb-3 px-2" style={{ color: 'var(--text-muted)' }}>
          {t('side.main')}
        </div>

        {NAV_ITEMS.map(({ name, href, icon: Icon, match, badge }: any) => {
          const isActive = pathname === href || pathname.startsWith(match)
          const isBinary = match === '/binary'
          return (
            <Link
              key={href}
              href={href}
              className={cn('sidebar-nav-item group', isActive && 'active')}
            >
              <div
                className="flex-center w-7 h-7 rounded-lg shrink-0"
                style={{
                  background: isActive ? (isBinary ? 'rgba(153,69,255,0.15)' : 'rgba(240,185,11,0.15)') : isBinary ? 'rgba(153,69,255,0.1)' : 'var(--bg-tertiary)',
                  color: isActive ? (isBinary ? '#9945FF' : 'var(--accent)') : isBinary ? '#9945FF' : 'var(--text-muted)',
                  transition: 'all 200ms',
                }}
              >
                <Icon size={15} />
              </div>
              <span className="flex-1 font-medium">{name}</span>
              {badge && !isActive && (
                <span style={{ fontSize: '0.58rem', fontWeight: 800, background: 'rgba(153,69,255,0.2)', color: '#9945FF', borderRadius: 20, padding: '1px 6px', letterSpacing: '0.05em' }}>
                  {badge}
                </span>
              )}
              {isActive && (
                <ChevronRight size={14} style={{ color: isBinary ? '#9945FF' : 'var(--accent)', opacity: 0.7 }} />
              )}
            </Link>
          )
        })}


        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="text-[10px] font-bold uppercase tracking-widest mt-6 mb-3 px-2" style={{ color: 'var(--text-muted)' }}>
              {t('side.admin')}
            </div>
            <Link
              href="/admin"
              className={cn('sidebar-nav-item', pathname.startsWith('/admin') && 'active')}
            >
              <div
                className="flex-center w-7 h-7 rounded-lg shrink-0"
                style={{
                  background: pathname.startsWith('/admin') ? 'rgba(240,185,11,0.15)' : 'rgba(246,70,93,0.1)',
                  color: pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--bear)',
                }}
              >
                <ShieldAlert size={15} />
              </div>
              <span className="flex-1 font-medium">{t('side.adminPanel')}</span>
              {pathname.startsWith('/admin') && (
                <ChevronRight size={14} style={{ color: 'var(--accent)', opacity: 0.7 }} />
              )}
            </Link>
          </>
        )}
      </div>

      {/* ─── Bottom ─── */}
      <div className="p-4 shrink-0 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <a href="mailto:support@nexotrading.com" className="sidebar-nav-item py-2 px-3">
          <HelpCircle size={18} className="text-[var(--text-muted)]" />
          <span className="font-medium">{t('side.help')}</span>
        </a>
        <Link href="/settings" className="sidebar-nav-item py-2 px-3">
          <Settings size={18} className="text-[var(--text-muted)]" />
          <span className="font-medium">{t('side.settings')}</span>
        </Link>

        {/* ── Language toggle at bottom of sidebar ── */}
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Language</span>
          <div className="flex bg-[var(--bg-tertiary)] rounded-full p-1 border border-[var(--border)]">
            {(['es', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-full transition-all uppercase tracking-wider",
                  lang === l ? "bg-[var(--accent)] text-black shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
