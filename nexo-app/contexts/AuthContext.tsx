// contexts/AuthContext.tsx
// Proveedor global de autenticación — disponible en toda la app cliente

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/supabase/types'
import { useTradingStore } from '@/lib/store'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  isLoading: boolean
  isDemoMode: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  isDemoMode: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        if (currentUser) {
          await loadProfile(currentUser.id)
        }
      } catch (err) {
        console.error('[AuthContext] Error loading user:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const loadProfile = async (userId: string) => {
      const supabase = createClient()
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ])

      const pRes = profileRes as any;
      const rRes = roleRes as any;
      if (pRes.data) {
        setProfile(pRes.data as Profile)
        // Sync database balance to Zustand store
        useTradingStore.setState({ balance: pRes.data.balance })
      }
      if (rRes.data) {
        setIsAdmin(rRes.data.some((r: { role: string }) => r.role === 'admin'))
      }
    }

    loadUser()

    // Escuchar cambios de sesión (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setIsAdmin(false)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data as Profile)
      useTradingStore.setState({ balance: data.balance })
    }
  }, [user])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err)
    }
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, isLoading, isDemoMode: false, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
