import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

type RiskLevel = 'high' | 'medium' | 'none';

interface MemberRisk {
  profileId: string;
  name: string;
  recentCheckIns: number; // últimos 14 días
  priorCheckIns: number; // 14-28 días atrás
  lastCheckIn: Date | null;
  risk: RiskLevel;
}

/**
 * Heurística simple de riesgo de cancelación, inspirada en las
 * señales de retención de Wodify/Fit Viz: compara asistencia
 * reciente contra el período anterior.
 *
 * - "high": tenía actividad regular (2+ check-ins) en el período
 *   anterior y cayó a 0 check-ins en los últimos 14 días.
 * - "medium": la asistencia cayó más del 50% respecto al período
 *   anterior (pero no a cero).
 * - "none": asistencia estable o en aumento.
 *
 * Esto es un punto de partida — en producción conviene ajustar los
 * umbrales con datos reales del box y considerar también el estado
 * de pago (past_due ya es una señal fuerte por sí sola).
 */
function classifyRisk(recent: number, prior: number): RiskLevel {
  if (prior >= 2 && recent === 0) return 'high';
  if (prior > 0 && recent / prior <= 0.5) return 'medium';
  return 'none';
}

async function getAtRiskMembers(boxId: string | null): Promise<MemberRisk[]> {
  if (!boxId) return [];

  const now = new Date();
  const recentStart = new Date(now);
  recentStart.setDate(now.getDate() - 14);
  const priorStart = new Date(now);
  priorStart.setDate(now.getDate() - 28);

  const [membersRes, checkInsRes] = await Promise.all([
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', boxId)
      .eq('status', 'active')
      .neq('role', 'coach'),
    supabaseAdmin
      .from('check_ins')
      .select('profile_id, checked_in_at')
      .eq('box_id', boxId)
      .gte('checked_in_at', priorStart.toISOString()),
  ]);

  const members = membersRes.data ?? [];
  const checkIns = checkInsRes.data ?? [];

  const results: MemberRisk[] = members.map((m: any) => {
    const mine = checkIns.filter((c: any) => c.profile_id === m.profile_id);
    const recent = mine.filter((c: any) => new Date(c.checked_in_at) >= recentStart).length;
    const prior = mine.filter((c: any) => new Date(c.checked_in_at) < recentStart).length;
    const last = mine.length
      ? mine.reduce((latest: Date, c: any) => {
          const d = new Date(c.checked_in_at);
          return d > latest ? d : latest;
        }, new Date(0))
      : null;

    return {
      profileId: m.profile_id,
      name: m.profiles?.full_name ?? '—',
      recentCheckIns: recent,
      priorCheckIns: prior,
      lastCheckIn: last,
      risk: classifyRisk(recent, prior),
    };
  });

  return results
    .filter((r) => r.risk !== 'none')
    .sort((a, b) => (a.risk === 'high' ? -1 : 1) - (b.risk === 'high' ? -1 : 1));
}

const RISK_STYLES: Record<RiskLevel, string> = {
  high: 'bg-accent/15 text-accent',
  medium: 'bg-warning/15 text-warning',
  none: '',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  high: 'Riesgo alto',
  medium: 'Riesgo medio',
  none: '',
};

export default async function RetentionPage() {
  const session = await requireStaffSession();
  const atRisk = await getAtRiskMembers(session.boxId);
  const highCount = atRisk.filter((m) => m.risk === 'high').length;
  const mediumCount = atRisk.filter((m) => m.risk === 'medium').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Retención</h1>
        <p className="text-secondary text-sm">
          Miembros con caída de asistencia en los últimos 14 días
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border border border-border mb-10">
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium text-accent">{highCount}</div>
          <div className="text-secondary text-sm mt-1">Riesgo alto — dejaron de venir</div>
        </div>
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium text-warning">{mediumCount}</div>
          <div className="text-secondary text-sm mt-1">Riesgo medio — asistencia cayó +50%</div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Atleta</th>
            <th>Últimos 14 días</th>
            <th>14-28 días atrás</th>
            <th>Último check-in</th>
            <th>Señal</th>
          </tr>
        </thead>
        <tbody>
          {atRisk.map((m) => (
            <tr key={m.profileId}>
              <td>{m.name}</td>
              <td className="text-secondary">{m.recentCheckIns}</td>
              <td className="text-secondary">{m.priorCheckIns}</td>
              <td className="text-secondary">
                {m.lastCheckIn ? m.lastCheckIn.toLocaleDateString('es-CO') : 'Sin registro'}
              </td>
              <td>
                <span className={`pill ${RISK_STYLES[m.risk]}`}>{RISK_LABELS[m.risk]}</span>
              </td>
            </tr>
          ))}
          {atRisk.length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                Sin señales de riesgo por ahora — buena asistencia general
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
