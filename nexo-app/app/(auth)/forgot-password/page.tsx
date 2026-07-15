"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="animate-slide-up flex flex-col items-center text-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bull-dim)' }}
        >
          <CheckCircle size={32} style={{ color: 'var(--bull)' }} />
        </div>
        <h1 className="text-2xl font-bold">¡Correo enviado!</h1>
        <p className="text-secondary max-w-xs">
          Revisa tu bandeja de entrada en <strong>{email}</strong> y haz clic
          en el enlace para restablecer tu contraseña.
        </p>
        <p className="text-xs text-muted mt-2">
          Si no lo ves en unos minutos, revisa la carpeta de spam.
        </p>
        <Link
          href="/login"
          className="btn btn-secondary mt-4 flex items-center gap-2 px-6 py-2.5 text-sm"
        >
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Volver al login
      </Link>

      <h1 className="text-3xl font-bold mb-2">¿Olvidaste tu contraseña?</h1>
      <p className="text-secondary mb-8">
        Ingresa tu email y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              className="input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full mt-2 py-3 text-base"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            'Enviar enlace de recuperación'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-secondary mt-8">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
