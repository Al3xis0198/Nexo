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
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate admin status synchronously if possible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedAdmin = localStorage.getItem('nexo_isAdmin') === 'true'
      if (cachedAdmin) setIsAdmin(true)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (userId: string, currentUser: any) => {
      // Reusar el cliente del useEffect (singleton, no crear uno nuevo)
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ])

      const pRes = profileRes as any
      const rRes = roleRes as any

      if (pRes.data) {
        const profileData = pRes.data as Profile
        setProfile(profileData)

        // ── CLAVE: inicializar el store para ESTE usuario concreto ──────
        // Si es un usuario diferente al anterior, limpia todo el estado local
        // y carga el balance real desde Supabase
        useTradingStore.getState().initForUser(userId, Number(profileData.balance))
      } else if (currentUser) {
        // Auto-crear perfil si no existe en BD (ej. cuentas creadas previo a migración)
        try {
          const defaultBalance = 10000.00
          const { data: newProfile, error: insertErr } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: currentUser.user_metadata?.full_name || '',
              email: currentUser.email || '',
              balance: defaultBalance
            } as any)
            .select()
            .single()

          if (newProfile) {
            setProfile(newProfile as Profile)
            useTradingStore.getState().initForUser(userId, defaultBalance)
          } else {
            console.error('Failed to auto-create profile:', insertErr)
          }
        } catch (err) {
          console.error('Error auto-creating profile:', err)
        }
      }
      if (rRes.data) {
        const adminStatus = rRes.data.some((r: { role: string }) => r.role === 'admin')
        setIsAdmin(adminStatus)
        if (typeof window !== 'undefined') {
          if (adminStatus) localStorage.setItem('nexo_isAdmin', 'true')
          else localStorage.removeItem('nexo_isAdmin')
        }
      }
    }

    const loadUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        if (currentUser) {
          await loadProfile(currentUser.id, currentUser)
        }
      } catch (err) {
        console.error('[AuthContext] Error loading user:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    // Escuchar cambios de sesión (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          useTradingStore.getState().resetStore()
          setProfile(null)
          setIsAdmin(false)
          if (typeof window !== 'undefined') localStorage.removeItem('nexo_isAdmin')
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
      const profileData = data as Profile
      setProfile(profileData)
      // Solo actualizar balance, sin tocar transacciones
      useTradingStore.setState({ balance: profileData.balance })
    }
  }, [user])

  const signOut = useCallback(async () => {
    try {
      // Limpiar store ANTES de hacer logout para evitar flash de datos
      useTradingStore.getState().resetStore()
      // Cerrar sesión en Supabase cliente (invalida el token JWT)
      const supabase = createClient()
      await supabase.auth.signOut()
      // Notificar al servidor para limpiar las cookies de sesión
      await fetch('/auth/logout', { method: 'POST' }).catch(() => {})
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err)
    }
    setUser(null)
    setProfile(null)
    setIsAdmin(false)
    if (typeof window !== 'undefined') localStorage.removeItem('nexo_isAdmin')
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
