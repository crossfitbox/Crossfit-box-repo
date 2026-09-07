import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { NewKioskTokenForm, RevokeKioskButton } from './kiosk-forms';

export default async function KioskPage() {
  const session = await requireStaffSession();

  const [tokensRes, locationsRes] = await Promise.all([
    supabaseAdmin.from('kiosk_tokens').select('id, label, token, active, locations(name)').eq('box_id', session.boxId),
    supabaseAdmin.from('locations').select('id, name').eq('box_id', session.boxId),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tu-panel.com';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Modo kiosco</h1>
          <p className="text-secondary text-sm">
            Tablets de recepción para check-in — cada una entra con un link
            propio, sin necesidad de login de staff
          </p>
        </div>
        <NewKioskTokenForm locations={locationsRes.data ?? []} />
      </div>

      <div className="flex flex-col gap-3">
        {(tokensRes.data ?? []).map((t: any) => (
          <div key={t.id} className="border border-border rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm text-primary">{t.label}</span>
                {t.locations?.name && <span className="text-xs text-secondary ml-2">{t.locations.name}</span>}
              </div>
              {t.active && <RevokeKioskButton tokenId={t.id} />}
            </div>
            {t.active ? (
              <code className="block bg-surface border border-border rounded px-3 py-2 text-xs text-secondary break-all">
                {baseUrl}/kiosco/{t.token}
              </code>
            ) : (
              <span className="pill bg-secondary/15 text-secondary">Revocado</span>
            )}
          </div>
        ))}
        {(tokensRes.data ?? []).length === 0 && (
          <p className="text-secondary text-sm py-6">Sin dispositivos registrados</p>
        )}
      </div>
    </div>
  );
}
