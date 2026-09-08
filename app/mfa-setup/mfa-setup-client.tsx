'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

/**
 * Se llega aquí solo cuando el box tiene `require_mfa_for_staff` activo
 * y el usuario todavía no tiene un factor TOTP verificado — ver el
 * chequeo en lib/require-staff.ts. Usa el SDK de Supabase Auth
 * directamente (auth.mfa.*), no hay tabla propia para esto.
 */
export default function MfaSetupPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startEnrollment() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
      setError(error.message);
    } else {
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    }
    setLoading(false);
  }

  async function confirmCode() {
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    if (verifyError) {
      setError('Código incorrecto — revisa tu app autenticadora');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm border border-border rounded p-8">
        <h1 className="font-display text-lg text-primary mb-2">Configura tu segundo factor</h1>
        <p className="text-secondary text-sm mb-6">
          Este box requiere autenticación en dos pasos para todo el staff.
        </p>

        {!qrCode ? (
          <button
            onClick={startEnrollment}
            disabled={loading}
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar código QR'}
          </button>
        ) : (
          <>
            <div
              className="bg-white p-3 rounded mb-4 inline-block"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            <p className="text-secondary text-xs mb-3">
              Escanea con Google Authenticator, 1Password o similar, y escribe el
              código de 6 dígitos que te muestre:
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary mb-3"
            />
            {error && <p className="text-accent text-sm mb-3">{error}</p>}
            <button
              onClick={confirmCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-accent text-primary text-sm py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Confirmar y continuar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
