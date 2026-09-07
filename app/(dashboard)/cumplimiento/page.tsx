import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewGdprRequestForm, ProcessGdprButton } from './gdpr-forms';
import { RetentionForm } from './retention-form';

const TYPE_LABELS: Record<string, string> = { export: 'Exportar', delete: 'Eliminar (derecho al olvido)' };
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-secondary/15 text-secondary',
  completed: 'bg-success/15 text-success',
  rejected: 'bg-accent/15 text-accent',
};

export default async function CompliancePage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [requestsRes, membersRes, retentionRes] = await Promise.all([
    supabaseAdmin
      .from('gdpr_requests')
      .select('id, request_type, status, notes, created_at, profiles(full_name)')
      .eq('box_id', session.boxId)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('box_members').select('profile_id, profiles(full_name)').eq('box_id', session.boxId),
    supabaseAdmin.from('data_retention_policies').select('entity_type, retain_days').eq('box_id', session.boxId),
  ]);

  const members = (membersRes.data ?? []).map((m: any) => ({ profileId: m.profile_id, name: m.profiles?.full_name ?? '—' }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Cumplimiento</h1>
        <p className="text-secondary text-sm">Solicitudes GDPR, retención de datos y export a SIEM</p>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-medium">Solicitudes GDPR</h2>
          {perms.members.edit && <NewGdprRequestForm members={members} />}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha</th>
              {perms.members.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {(requestsRes.data ?? []).map((r: any) => (
              <tr key={r.id}>
                <td>{r.profiles?.full_name ?? '—'}</td>
                <td className="text-secondary">{TYPE_LABELS[r.request_type]}</td>
                <td><span className={`pill ${STATUS_STYLES[r.status]}`}>{r.status}</span></td>
                <td className="text-secondary">{new Date(r.created_at).toLocaleDateString('es-CO')}</td>
                {perms.members.edit && (
                  <td>
                    {r.status === 'pending' && (
                      <ProcessGdprButton requestId={r.id} profileId={r.profiles?.id} type={r.request_type} />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {(requestsRes.data ?? []).length === 0 && (
              <tr><td colSpan={5} className="text-secondary text-center py-8">Sin solicitudes registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mb-10">
        <h2 className="font-display text-sm font-medium mb-3">Retención de datos</h2>
        <table className="data-table mb-3">
          <thead><tr><th>Tabla</th><th>Días de retención</th></tr></thead>
          <tbody>
            {(retentionRes.data ?? []).map((r: any) => (
              <tr key={r.entity_type}><td className="font-mono text-xs">{r.entity_type}</td><td>{r.retain_days} días</td></tr>
            ))}
            {(retentionRes.data ?? []).length === 0 && (
              <tr><td colSpan={2} className="text-secondary text-center py-6">Sin políticas — se conserva todo indefinidamente</td></tr>
            )}
          </tbody>
        </table>
        {session.role === 'owner' && <RetentionForm />}
      </div>

      <div className="border border-border rounded p-4 max-w-lg">
        <h2 className="text-sm text-primary mb-2">Export a SIEM</h2>
        <p className="text-secondary text-xs">
          Cada evento de auditoría se reenvía automáticamente a cualquier webhook
          suscrito a <code>audit.log</code> — configúralo en{' '}
          <a href="/desarrolladores" className="text-accent">Desarrolladores</a>, mismo mecanismo
          que los demás webhooks, firmado con HMAC.
        </p>
      </div>
    </div>
  );
}
