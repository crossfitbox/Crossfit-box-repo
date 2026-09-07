import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { AdjustCreditsForm } from './adjust-credits-form';

const REASON_LABELS: Record<string, string> = {
  period_grant: 'Otorgado (nuevo período)',
  booking_hold: 'Reservado',
  booking_consumed: 'Consumido (check-in)',
  booking_refunded: 'Devuelto (cancelación a tiempo)',
  no_show_penalty: 'Penalización por no-show',
  late_cancel_penalty: 'Penalización por cancelación tardía',
  manual_adjustment: 'Ajuste manual',
  expired: 'Vencido',
};

async function getBalances(boxId: string) {
  const [membersRes, ledgerRes] = await Promise.all([
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', boxId)
      .eq('role', 'athlete')
      .eq('status', 'active'),
    supabaseAdmin
      .from('credit_ledger')
      .select('profile_id, delta')
      .eq('box_id', boxId),
  ]);

  const balances = new Map<string, number>();
  for (const row of ledgerRes.data ?? []) {
    balances.set(row.profile_id, (balances.get(row.profile_id) ?? 0) + row.delta);
  }

  return (membersRes.data ?? [])
    .map((m: any) => ({
      profileId: m.profile_id,
      name: m.profiles?.full_name ?? '—',
      balance: balances.get(m.profile_id) ?? 0,
      hasCredits: balances.has(m.profile_id),
    }))
    .sort((a, b) => a.balance - b.balance);
}

async function getRecentMovements(boxId: string) {
  const { data } = await supabaseAdmin
    .from('credit_ledger')
    .select('id, delta, reason, note, created_at, profiles(full_name)')
    .eq('box_id', boxId)
    .order('created_at', { ascending: false })
    .limit(30);

  return data ?? [];
}

export default async function CreditsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const [balances, movements] = await Promise.all([
    getBalances(session.boxId),
    getRecentMovements(session.boxId),
  ]);

  const memberOptions = balances.map((b) => ({ profileId: b.profileId, name: b.name }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Créditos</h1>
        <p className="text-secondary text-sm">
          Saldo de clases por atleta — el box está configurado para descontar
          crédito al {session.boxId ? 'hacer check-in' : ''}, no solo al reservar
        </p>
      </div>

      {perms.credits.create && <AdjustCreditsForm members={memberOptions} />}

      <div className="grid grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-sm font-medium mb-3">Saldo por atleta</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.profileId}>
                  <td>{b.name}</td>
                  <td>
                    {b.hasCredits ? (
                      <span
                        className={`pill ${
                          b.balance <= 0
                            ? 'bg-accent/15 text-accent'
                            : b.balance <= 2
                              ? 'bg-warning/15 text-warning'
                              : 'bg-success/15 text-success'
                        }`}
                      >
                        {b.balance}
                      </span>
                    ) : (
                      <span className="text-secondary text-xs">Ilimitado</span>
                    )}
                  </td>
                </tr>
              ))}
              {balances.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-secondary text-center py-8">
                    Sin atletas activos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-display text-sm font-medium mb-3">Movimientos recientes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Motivo</th>
                <th>Cambio</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id}>
                  <td>{m.profiles?.full_name ?? '—'}</td>
                  <td className="text-secondary">
                    {REASON_LABELS[m.reason] ?? m.reason}
                    {m.note && <span className="block text-xs">{m.note}</span>}
                  </td>
                  <td className={m.delta > 0 ? 'text-success' : 'text-accent'}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-secondary text-center py-8">
                    Sin movimientos todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
