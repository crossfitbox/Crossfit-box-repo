import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewApiKeyForm, RevokeKeyButton, NewWebhookForm, DeleteWebhookButton } from './developer-forms';

export default async function DevelopersPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [keysRes, webhooksRes] = await Promise.all([
    supabaseAdmin.from('api_keys').select('id, name, key_prefix, scopes, revoked, last_used_at, created_at').eq('box_id', session.boxId).order('created_at', { ascending: false }),
    supabaseAdmin.from('webhooks').select('id, url, events, active, webhook_deliveries(id, event_type, response_status, delivered_at)').eq('box_id', session.boxId),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Desarrolladores</h1>
        <p className="text-secondary text-sm">API keys y webhooks para integrar sistemas externos</p>
      </div>

      <div className="mb-10 border border-border rounded p-4">
        <h2 className="font-display text-sm font-medium mb-3">Endpoints disponibles</h2>
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div><span className="text-success">GET</span> <span className="text-secondary">/api/v1/classes</span> — próximas clases</div>
          <div><span className="text-success">GET</span> <span className="text-secondary">/api/v1/members</span> — miembros del box</div>
          <div><span className="text-accent">POST</span> <span className="text-secondary">/api/v1/bookings</span> — crear una reserva</div>
        </div>
        <p className="text-secondary text-xs mt-3">
          Autenticación: header <code>Authorization: Bearer &lt;tu_api_key&gt;</code>
        </p>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-medium">API keys</h2>
          {perms.settings.edit && <NewApiKeyForm />}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Prefijo</th>
              <th>Alcance</th>
              <th>Último uso</th>
              <th>Estado</th>
              {perms.settings.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {(keysRes.data ?? []).map((k: any) => (
              <tr key={k.id}>
                <td>{k.name}</td>
                <td className="text-secondary font-mono text-xs">{k.key_prefix}...</td>
                <td className="text-secondary">{(k.scopes ?? []).join(', ')}</td>
                <td className="text-secondary">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('es-CO') : 'Nunca'}</td>
                <td>
                  <span className={`pill ${k.revoked ? 'bg-secondary/15 text-secondary' : 'bg-success/15 text-success'}`}>
                    {k.revoked ? 'Revocada' : 'Activa'}
                  </span>
                </td>
                {perms.settings.edit && <td>{!k.revoked && <RevokeKeyButton keyId={k.id} />}</td>}
              </tr>
            ))}
            {(keysRes.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="text-secondary text-center py-8">Sin API keys creadas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-medium">Webhooks</h2>
          {perms.settings.edit && <NewWebhookForm />}
        </div>
        <div className="flex flex-col gap-3">
          {(webhooksRes.data ?? []).map((w: any) => {
            const recentDeliveries = (w.webhook_deliveries ?? []).slice(-5).reverse();
            return (
              <div key={w.id} className="border border-border rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-primary break-all">{w.url}</span>
                  {perms.settings.edit && <DeleteWebhookButton webhookId={w.id} />}
                </div>
                <div className="text-xs text-secondary mb-2">{(w.events ?? []).join(', ')}</div>
                {recentDeliveries.length > 0 && (
                  <div className="border-t border-border pt-2 flex flex-col gap-1">
                    {recentDeliveries.map((d: any) => (
                      <div key={d.id} className="text-xs text-secondary flex justify-between">
                        <span>{d.event_type}</span>
                        <span className={d.response_status && d.response_status < 300 ? 'text-success' : 'text-accent'}>
                          {d.response_status ?? 'pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {(webhooksRes.data ?? []).length === 0 && (
            <p className="text-secondary text-sm py-4">Sin webhooks configurados</p>
          )}
        </div>
      </div>
    </div>
  );
}
