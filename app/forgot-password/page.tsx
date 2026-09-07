'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError('No se pudo enviar el correo — intenta de nuevo');
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm border border-border rounded p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <div className="w-4 h-2.5 bg-primary rounded-sm" />
          </div>
          <span className="font-display font-medium text-lg text-primary">Box Admin</span>
        </div>

        {sent ? (
          <>
            <h1 className="text-primary text-lg mb-2">Revisa tu correo</h1>
            <p className="text-secondary text-sm mb-6">
              Si <strong>{email}</strong> tiene una cuenta, te llegó un link para
              crear una contraseña nueva. Puede tardar unos minutos.
            </p>
            <Link href="/login" className="text-accent text-sm">Volver a entrar</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="text-primary text-lg mb-2">Recuperar contraseña</h1>
            <p className="text-secondary text-sm mb-6">
              Te enviamos un link para crear una nueva.
            </p>

            <label className="block text-sm text-secondary mb-1">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-4 outline-none focus:border-accent"
            />

            {error && <p className="text-accent text-sm mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-primary text-sm py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50 mb-4"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>

            <Link href="/login" className="text-secondary text-sm">Volver a entrar</Link>
          </form>
        )}
      </div>
    </div>
  );
}
