import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewReceivableForm, ApplyPaymentForm } from './receivable-forms';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-secondary/15 text-secondary',
  partial: 'bg-warning/15 text-warning',
  paid: 'bg-success/15 text-success',
  overdue: 'bg-accent/15 text-accent',
  written_off: 'bg-secondary/15 text-secondary',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Abono parcial',
  paid: 'Pagada',
  overdue: 'Vencida',
  written_off: 'Castigada',
};

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function ReceivablesPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [receivablesRes, membersRes] = await Promise.all([
    supabaseAdmin
      .from('receivables')
      .select('id, description, original_amount_cents, balance_cents, currency, due_date, status, profiles(full_name)')
      .eq('box_id', session.boxId)
      .order('due_date', { ascending: true }),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('status', 'active'),
  ]);

  const receivables = receivablesRes.data ?? [];
  const members = (membersRes.data ?? []).map((m: any) => ({
    profileId: m.profile_id,
    name: m.profiles?.full_name ?? '—',
  }));

  const totalOwed = receivables
    .filter((r) => r.status !== 'paid' && r.status !== 'written_off')
    .reduce((s, r) => s + r.balance_cents, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Cuentas por cobrar</h1>
          <p className="text-secondary text-sm">
            Total pendiente: <span className="text-accent">{formatCOP(totalOwed)}</span>
          </p>
        </div>
        {perms.finance.create && <NewReceivableForm members={members} />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Atleta</th>
            <th>Descripción</th>
            <th>Original</th>
            <th>Saldo</th>
            <th>Vence</th>
            <th>Estado</th>
            {perms.finance.create && <th></th>}
          </tr>
        </thead>
        <tbody>
          {receivables.map((r: any) => (
            <tr key={r.id}>
              <td>{r.profiles?.full_name ?? '—'}</td>
              <td className="text-secondary">{r.description}</td>
              <td className="text-secondary">{formatCOP(r.original_amount_cents)}</td>
              <td className={r.balance_cents > 0 ? 'text-accent' : 'text-success'}>
                {formatCOP(r.balance_cents)}
              </td>
              <td className="text-secondary">{new Date(r.due_date).toLocaleDateString('es-CO')}</td>
              <td>
                <span className={`pill ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
              </td>
              {perms.finance.create && (
                <td>
                  {r.balance_cents > 0 && (
                    <ApplyPaymentForm receivable={{ id: r.id, label: r.description }} />
                  )}
                </td>
              )}
            </tr>
          ))}
          {receivables.length === 0 && (
            <tr>
              <td colSpan={7} className="text-secondary text-center py-10">
                Sin cuentas por cobrar registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
