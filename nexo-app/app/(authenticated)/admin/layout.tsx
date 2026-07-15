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
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[AdminLayout] No user session:', userError?.message)
      redirect('/login')
    }

    // ── Intento 1: RPC has_role ────────────────────────────────────────────
    let isAdmin = false
    // @ts-expect-error - RPC args not fully typed in local Database type
    const { data: rpcResult, error: rpcError } = await supabase.rpc('has_role', {
      p_user_id: user.id,
      p_role: 'admin',
    })

    if (rpcError) {
      console.error('[AdminLayout] RPC has_role error:', rpcError.message, rpcError.code)

      // ── Intento 2: Query directa a user_roles (fallback) ─────────────────
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      if (roleError) {
        console.error('[AdminLayout] Direct role query error:', roleError.message)
        // Si no podemos verificar el rol por error de DB/credenciales,
        // redirigimos con error específico para debugging
        redirect('/dashboard?error=role_check_failed')
      }

      isAdmin = (roleRows ?? []).some((r: { role: string }) => r.role === 'admin')
      console.log('[AdminLayout] Fallback role check result:', { isAdmin, roles: roleRows })
    } else {
      isAdmin = rpcResult === true
      console.log('[AdminLayout] RPC result:', { isAdmin, rpcResult })
    }

    if (!isAdmin) {
      console.warn('[AdminLayout] Access denied for user:', user.id)
      redirect('/dashboard?error=unauthorized')
    }

    console.log('[AdminLayout] Admin access granted for user:', user.id)
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  )
}
