// app/(authenticated)/admin/layout.tsx
// Server Component — verifica rol admin ANTES de renderizar

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const DEMO_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT_ID')

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!DEMO_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verificar rol admin con la función RPC de Supabase
    // @ts-expect-error - RPC args are not fully typed in local types
    const { data: isAdmin } = await supabase.rpc('has_role', {
      p_user_id: user.id,
      p_role: 'admin',
    })

    if (!isAdmin) {
      redirect('/dashboard?error=unauthorized')
    }
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
}
