'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

/**
 * Supabase redirige aquí con un token de recuperación en la URL (hash
 * o query, según versión del SDK) y el propio cliente de supabase-js
 * lo detecta automáticamente al cargar la página, dejando al usuario
 * en una sesión temporal válida SOLO para llamar updateUser({password}).
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError('El link expiró o ya se usó — pide uno nuevo desde "Olvidé mi contraseña"');
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-6">
        <p className="text-primary">Contraseña actualizada — entrando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-border rounded p-8">
        <h1 className="text-primary text-lg mb-2">Crea tu nueva contraseña</h1>
        <p className="text-secondary text-sm mb-6">Mínimo 8 caracteres.</p>

        <label className="block text-sm text-secondary mb-1">Nueva contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-4 outline-none focus:border-accent"
        />

        <label className="block text-sm text-secondary mb-1">Confirma la contraseña</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-4 outline-none focus:border-accent"
        />

        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-primary text-sm py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}
