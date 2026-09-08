'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Antes de intentar con contraseña, revisar si el dominio del
    // correo tiene SSO obligatorio configurado. Si esta verificación
    // falla por lo que sea (tabla no existe, red, etc.), NUNCA debe
    // bloquear el login normal — sigue de largo con contraseña.
    const domain = email.split('@')[1];
    if (domain) {
      try {
        const res = await fetch(`/api/auth/sso-check?domain=${encodeURIComponent(domain)}`);
        const check = await res.json();

        if (check.sso) {
          const { data, error: ssoError } = await supabase.auth.signInWithSSO({
            providerId: check.providerId,
          });
          if (ssoError) {
            setError('No se pudo iniciar sesión con SSO — contacta a tu administrador');
            setLoading(false);
            return;
          }
          if (data?.url) window.location.href = data.url;
          return;
        }
      } catch {
        // sso-check falló — seguimos con login normal por contraseña
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Mostramos el mensaje real de Supabase (no uno genérico) para
      // poder diagnosticar: puede ser contraseña, email sin confirmar,
      // o incluso variables de entorno mal configuradas.
      setError(`${error.message} (código: ${error.status ?? 'sin código'})`);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-border rounded p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <div className="w-4 h-2.5 bg-primary rounded-sm" />
          </div>
          <span className="font-display font-medium text-lg text-primary">
            Box Admin
          </span>
        </div>

        <label className="block text-sm text-secondary mb-1">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-4 outline-none focus:border-accent"
        />

        <label className="block text-sm text-secondary mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-6 outline-none focus:border-accent"
        />

        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-primary text-sm py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <Link href="/forgot-password" className="block text-center text-secondary text-sm mt-4 hover:text-primary">
          ¿Olvidaste tu contraseña?
        </Link>

        <p className="text-secondary text-xs mt-4">
          Solo coaches, admins y dueños del box tienen acceso a este panel.
        </p>
      </form>
    </div>
  );
}
