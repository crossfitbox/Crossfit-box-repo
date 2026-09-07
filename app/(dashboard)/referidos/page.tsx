import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewReferralForm } from './referral-form';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  qualified: 'Calificado',
  rewarded: 'Recompensado',
};
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-secondary/15 text-secondary',
  qualified: 'bg-success/15 text-success',
  rewarded: 'bg-success/15 text-success',
};

export default async function ReferralsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [referralsRes, membersRes] = await Promise.all([
    supabaseAdmin
      .from('referrals')
      .select('id, status, reward_credits, created_at, qualified_at, referrer:profiles!referrer_profile_id(full_name), referred:profiles!referred_profile_id(full_name)')
      .eq('box_id', session.boxId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('status', 'active'),
  ]);

  const referrals = referralsRes.data ?? [];
  const qualified = referrals.filter((r: any) => r.status !== 'pending').length;
  const conversionRate = referrals.length > 0 ? Math.round((qualified / referrals.length) * 100) : 0;

  const members = (membersRes.data ?? []).map((m: any) => ({
    profileId: m.profile_id,
    name: m.profiles?.full_name ?? '—',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Referidos</h1>
          <p className="text-secondary text-sm">
            Tasa de conversión: {conversionRate}% ({qualified}/{referrals.length})
          </p>
        </div>
        {perms.members.edit && <NewReferralForm members={members} />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Referidor</th>
            <th>Referido</th>
            <th>Recompensa</th>
            <th>Estado</th>
            <th>Registrado</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r: any) => (
            <tr key={r.id}>
              <td>{r.referrer?.full_name ?? '—'}</td>
              <td>{r.referred?.full_name ?? '—'}</td>
              <td className="text-secondary">{r.reward_credits} créditos</td>
              <td>
                <span className={`pill ${STATUS_STYLES[r.status]}`}>{STATUS_LABELS[r.status]}</span>
              </td>
              <td className="text-secondary">{new Date(r.created_at).toLocaleDateString('es-CO')}</td>
            </tr>
          ))}
          {referrals.length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                Sin referidos registrados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
