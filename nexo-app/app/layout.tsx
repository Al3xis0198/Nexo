// app/layout.tsx — Root layout con AuthProvider + LangProvider

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { LangProvider } from '@/contexts/LangContext'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: { default: 'NexoTrading', template: '%s | NexoTrading' },
  description: 'Professional trading platform for crypto, stocks, forex and commodities.',
  keywords: ['trading', 'crypto', 'bitcoin', 'forex', 'stocks', 'platform'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <LangProvider>
          <AuthProvider>
            {children}
            <Toaster theme="dark" position="bottom-right" richColors />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  )
}

