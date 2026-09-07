import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

async function getSummary(boxId: string | null) {
  if (!boxId) {
    return { activeMembers: 0, todayClasses: 0, todayCheckIns: 0, pastDue: 0 };
  }

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const [members, classes, checkIns, pastDue] = await Promise.all([
    supabaseAdmin
      .from('box_members')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .eq('status', 'active'),
    supabaseAdmin
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay),
    supabaseAdmin
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .gte('checked_in_at', startOfDay)
      .lte('checked_in_at', endOfDay),
    supabaseAdmin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', boxId)
      .eq('status', 'past_due'),
  ]);

  return {
    activeMembers: members.count ?? 0,
    todayClasses: classes.count ?? 0,
    todayCheckIns: checkIns.count ?? 0,
    pastDue: pastDue.count ?? 0,
  };
}

export default async function DashboardPage() {
  const session = await requireStaffSession();
  const summary = await getSummary(session.boxId);

  const stats = [
    { label: 'Miembros activos', value: summary.activeMembers },
    { label: 'Clases hoy', value: summary.todayClasses },
    { label: 'Check-ins hoy', value: summary.todayCheckIns },
    { label: 'Pagos vencidos', value: summary.pastDue, warn: summary.pastDue > 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-1">Resumen</h1>
      <p className="text-secondary text-sm mb-8">
        Estado del box a hoy, {new Date().toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>

      <div className="grid grid-cols-4 gap-px bg-border border border-border">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg px-5 py-6">
            <div
              className={`font-display text-3xl font-medium ${
                s.warn ? 'text-warning' : 'text-primary'
              }`}
            >
              {s.value}
            </div>
            <div className="text-secondary text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
