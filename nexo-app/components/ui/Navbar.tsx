/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Bell, ChevronDown, LogOut, User, Settings, ShieldAlert, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'
import { useTradingStore } from '@/lib/store'
import { formatCurrency, cn } from '@/lib/utils'
import NexoLogo from './NexoLogo'
import { toast } from 'sonner'

// ── Language Toggle Button ───────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useLang()
  const isES = lang === 'es'

  return (
    <button
      onClick={() => setLang(isES ? 'en' : 'es')}
      title={isES ? 'Switch to English' : 'Cambiar a Español'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-secondary)] font-bold text-xs select-none"
    >
      <span className="text-sm leading-none">{isES ? '🇪🇸' : '🇺🇸'}</span>
      <span className="uppercase tracking-wider">{isES ? 'ES' : 'EN'}</span>
    </button>
  )
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, profile, isAdmin, isDemoMode, signOut } = useAuth()
  const { t } = useLang()
  const balance = useTradingStore((s) => s.balance)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  const displayBalance = balance
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleLogout = async () => {
    setDropdownOpen(false)
    try {
      await signOut()
    } catch (err) {
      console.error('Logout failed:', err)
    }
    // Force a full reload to clear all client-side state
    window.location.href = '/login'
  }

  const handleNotifications = () => {
    toast.info('No new notifications.', {
      description: 'You are all caught up!',
      duration: 3000,
    })
  }

  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 md:px-6"
      style={{
        height: 'var(--navbar-height)',
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)' as any,
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <NexoLogo size={28} />
          <span className="font-bold text-sm">Nexo<span style={{ color: 'var(--accent)' }}>Trading</span></span>
        </Link>

        <div className="hidden md:block search-bar" style={{ width: 280 }}>
          <Search size={15} className="search-icon" />
          <input type="text" placeholder={t('app.search')} />
        </div>


      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Language Toggle */}
        <LangToggle />

        {/* Balance */}
        <button
          onClick={() => router.push('/wallet')}
          className="hidden md:flex flex-col items-end px-4 py-2 rounded-lg transition-colors cursor-pointer"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('app.balance')}</span>
          <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(displayBalance)}
          </span>
        </button>

        {/* Bell */}
        <button 
          onClick={handleNotifications}
          className="relative flex-center w-9 h-9 rounded-lg"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
        >
          <Bell size={17} style={{ color: 'var(--text-secondary)' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
        </button>

        <div className="w-px h-6 hidden md:block" style={{ background: 'var(--border)' }} />

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors border", dropdownOpen ? 'bg-[var(--bg-tertiary)] border-[var(--border)]' : 'bg-transparent border-transparent hover:bg-[var(--bg-tertiary)]')}
          >
            <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-xs bg-[var(--accent)] text-black">
              {initials}
            </div>
            <div className="hidden md:flex flex-col items-start justify-center text-left">
              <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{displayName}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(240,185,11,0.2)' }}>
                  {profile?.level ?? 'STANDARD'}
                </span>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase" style={{ background: 'rgba(246,70,93,0.1)', color: '#F6465D', border: '1px solid rgba(246,70,93,0.2)' }}>
                    ADMIN
                  </span>
                )}
              </div>
            </div>
            <ChevronDown size={14} className="shrink-0" style={{ color: 'var(--text-muted)', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0" style={{ zIndex: 'var(--z-dropdown)' as any }}
                onClick={() => setDropdownOpen(false)} />

              <div className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden animate-slide-up"
                style={{ width: 220, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-modal)', zIndex: 9999 }}>
                {/* User Info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="font-semibold text-sm truncate">{displayName}</div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(240,185,11,0.2)' }}>
                    ✦ {profile?.level ?? 'STANDARD'}
                  </div>
                </div>

                <div className="p-1.5 flex flex-col">
                  <Link href="/wallet" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Wallet size={15} /> {t('app.wallet')}
                  </Link>
                  <Link href="/settings" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-secondary)' }}>
                    <User size={15} /> {t('app.profile')}
                  </Link>
                  <Link href="/settings" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Settings size={15} /> {t('side.settings')}
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--accent-dim)]"
                      style={{ color: 'var(--accent)' }}>
                      <ShieldAlert size={15} /> {t('app.adminPanel')}
                    </Link>
                  )}
                  <div className="my-1 h-px" style={{ background: 'var(--border)' }} />
                  <button onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bear-dim)]"
                    style={{ color: 'var(--bear)' }}>
                    <LogOut size={15} /> {t('app.logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
