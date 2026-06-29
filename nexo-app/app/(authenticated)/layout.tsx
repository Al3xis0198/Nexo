// app/(authenticated)/layout.tsx — Layout protegido
// Server Component que verifica sesión y provee Sidebar + Navbar

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/ui/Sidebar'
import Navbar from '@/components/ui/Navbar'
import TickerTape from '@/components/ui/TickerTape'
import MobileNav from '@/components/ui/MobileNav'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <TickerTape />
        {/* On mobile, add padding bottom for the MobileNav */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
