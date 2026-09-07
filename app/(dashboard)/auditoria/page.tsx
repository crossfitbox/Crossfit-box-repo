import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

const ENTITY_LABELS: Record<string, string> = {
  subscription: 'Suscripción',
  payment: 'Pago',
  credit: 'Crédito',
  booking: 'Reserva',
  result: 'Resultado',
  member: 'Miembro',
  expense: 'Gasto',
  plan: 'Plan',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó',
  update: 'Actualizó',
  delete: 'Borró',
  adjust: 'Ajustó',
};

async function getAuditLog(boxId: string) {
  const { data } = await supabaseAdmin
    .from('audit_log')
    .select(
      'id, action, entity_type, field_changed, old_value, new_value, reason, created_at, profiles(full_name)',
    )
    .eq('box_id', boxId)
    .order('created_at', { ascending: false })
    .limit(100);

  return data ?? [];
}

export default async function AuditPage() {
  const session = await requireStaffSession();
  const entries = await getAuditLog(session.boxId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Auditoría</h1>
        <p className="text-secondary text-sm">
          Registro de cambios críticos — solo lectura, no se puede editar ni
          borrar desde aquí
        </p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Cuándo</th>
            <th>Quién</th>
            <th>Acción</th>
            <th>Sobre</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e: any) => (
            <tr key={e.id}>
              <td className="text-secondary whitespace-nowrap">
                {new Date(e.created_at).toLocaleString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td>{e.profiles?.full_name ?? 'Sistema'}</td>
              <td className="text-secondary">{ACTION_LABELS[e.action] ?? e.action}</td>
              <td>
                {ENTITY_LABELS[e.entity_type] ?? e.entity_type}
                {e.field_changed && (
                  <span className="text-secondary text-xs"> · {e.field_changed}</span>
                )}
              </td>
              <td className="text-secondary">{e.reason ?? '—'}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                Sin actividad registrada todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
