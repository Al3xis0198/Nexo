'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, BarChart2, TrendingUp, Wallet, ShieldAlert, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_ITEMS = [
  { name: 'Home',    href: '/dashboard',    icon: LayoutDashboard, match: '/dashboard' },
  { name: 'Markets', href: '/markets',       icon: BarChart2,       match: '/markets' },
  { name: 'Trade',   href: '/trade/BTC-USD', icon: TrendingUp,      match: '/trade' },
  { name: 'Binary',  href: '/binary',        icon: Zap,             match: '/binary', color: '#9945FF' },
  { name: 'Wallet',  href: '/wallet',        icon: Wallet,          match: '/wallet' },
]


export default function MobileNav() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  return (
    <div className="md:hidden">
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{
          height: 'calc(env(safe-area-inset-bottom) + 60px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          background: 'rgba(11, 14, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(43,49,57,0.8)',
        }}
      >
        {MOBILE_ITEMS.map(({ name, href, icon: Icon, match, color }: any) => {
          const isActive = pathname === href || pathname.startsWith(match)
          const activeColor = color || 'var(--accent)'
          return (
            <Link
              key={name}
              href={href}
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
              style={{ color: isActive ? activeColor : 'var(--text-muted)' }}
            >
              <Icon size={22} className={cn("transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium tracking-wide">{name}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors"
            style={{ color: pathname.startsWith('/admin') ? 'var(--accent)' : 'var(--bear)' }}
          >
            <ShieldAlert size={22} className={cn("transition-transform", pathname.startsWith('/admin') && "scale-110")} />
            <span className="text-[10px] font-medium tracking-wide">Admin</span>
          </Link>
        )}
      </nav>
    </div>
  )
}
