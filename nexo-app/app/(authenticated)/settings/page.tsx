/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import { Shield, User, Settings as SettingsIcon, Loader2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '')
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!user) return
    setLoading(true)
    const supabase = createClient()
    // @ts-expect-error - strict generated types prevent full_name update
    const { error } = await supabase.from('profiles').update({ full_name: fullName as any }).eq('id', user.id)

    if (error) {
      toast.error('Error al actualizar perfil: ' + error.message)
    } else {
      toast.success('Perfil actualizado correctamente')
      await refreshProfile()
    }
    setLoading(false)
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error('Error al cambiar contraseña: ' + error.message);
    } else {
      toast.success('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
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
                <button className="btn btn-sm btn-ghost" onClick={() => toast.info('Función 2FA estará disponible próximamente')}>Enable</button>
              </div>
              <div className="flex-between p-3 border border-border rounded-lg bg-[var(--bg-secondary)]">
                <div>
                  <div className="font-semibold text-sm">Change Password</div>
                  <div className="text-xs text-secondary mt-1">Update your login password.</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowPasswordModal(true)}>Update</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div className="card max-w-md w-full relative animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="text-accent" size={20} /> Update Password
            </h3>
            
            <div className="space-y-4">
              <div className="input-group">
                <label className="input-label">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="input pl-10 pr-10" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="input pl-10 pr-10" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="btn border border-border text-secondary hover:text-primary" 
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary min-w-[120px]" 
                onClick={handleUpdatePassword}
                disabled={passwordLoading || !newPassword || !confirmPassword}
              >
                {passwordLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
