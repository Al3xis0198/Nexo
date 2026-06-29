/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import { Shield, User, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line
    if (profile) setFullName(profile.full_name || '')
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    // @ts-expect-error - strict generated types prevent full_name update
    const { error } = await supabase.from('profiles').update({ full_name: fullName as any }).eq('id', user.id)

    if (error) {
      toast.error('Failed to update profile: ' + error.message)
    } else {
      toast.success('Profile updated successfully')
      await refreshProfile()
    }
    setLoading(false)
  }
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="page-header border-b border-border pb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <SettingsIcon size={24} className="text-accent" /> Settings
          </h1>
          <p className="page-subtitle">Manage your account preferences and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          {['Profile', 'Security', 'Notifications', 'API Keys'].map((tab, i) => (
            <button key={tab} className={`text-left px-4 py-3 rounded-lg font-medium transition-colors ${i === 0 ? 'bg-[var(--bg-tertiary)] text-accent' : 'text-secondary hover:text-primary hover:bg-[var(--bg-secondary)]'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="card hover:border-[var(--border-focus)] transition-all duration-300">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <User size={18} className="text-accent" /> Profile Information
            </h3>
            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your display name" 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" className="input opacity-70" value={user?.email || ''} disabled />
                <div className="text-xs text-secondary mt-1">Email cannot be changed directly for security reasons.</div>
              </div>
              <button 
                onClick={handleUpdateProfile} 
                className="btn btn-primary mt-2"
                disabled={loading || !fullName.trim() || fullName === profile?.full_name}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="card border-[rgba(240,185,11,0.2)] hover:border-[var(--border-focus)] transition-all duration-300">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Shield size={18} className="text-accent" /> Account Security
            </h3>
            <div className="space-y-4">
              <div className="flex-between p-3 border border-border rounded-lg bg-[var(--bg-secondary)]">
                <div>
                  <div className="font-semibold text-sm">Two-Factor Authentication (2FA)</div>
                  <div className="text-xs text-secondary mt-1">Protect your account with an authenticator app.</div>
                </div>
                <button className="btn btn-sm btn-ghost">Enable</button>
              </div>
              <div className="flex-between p-3 border border-border rounded-lg bg-[var(--bg-secondary)]">
                <div>
                  <div className="font-semibold text-sm">Change Password</div>
                  <div className="text-xs text-secondary mt-1">Update your login password.</div>
                </div>
                <button className="btn btn-sm btn-ghost">Update</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
