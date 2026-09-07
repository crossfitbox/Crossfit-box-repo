import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg px-5 py-6">
      <div className="font-display text-2xl font-medium">{value}</div>
      <div className="text-secondary text-sm mt-1">{label}</div>
      {sub && <div className="text-secondary text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-sm font-medium mb-3">{title}</h2>
      <div className="grid grid-cols-3 gap-px bg-border border border-border">{children}</div>
    </div>
  );
}

export default async function KpisPage() {
  const session = await requireStaffSession();
  const boxId = session.boxId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    activeMembers,
    newMembers,
    payments30d,
    allTimePayments,
    classes30d,
    bookings30d,
    checkins7d,
    riskMembers,
    prsThisMonth,
    wodParticipants,
  ] = await Promise.all([
    supabaseAdmin.from('box_members').select('id', { count: 'exact', head: true }).eq('box_id', boxId).eq('role', 'athlete').eq('status', 'active'),
    supabaseAdmin.from('box_members').select('id', { count: 'exact', head: true }).eq('box_id', boxId).eq('role', 'athlete').gte('joined_at', thirtyDaysAgo),
    supabaseAdmin.from('payments').select('amount_cents').eq('box_id', boxId).eq('status', 'paid').gte('paid_at', thirtyDaysAgo),
    supabaseAdmin.from('payments').select('amount_cents, profile_id').eq('box_id', boxId).eq('status', 'paid'),
    supabaseAdmin.from('classes').select('id, capacity, starts_at, bookings(id, status)').eq('box_id', boxId).gte('starts_at', thirtyDaysAgo).lte('starts_at', new Date().toISOString()),
    supabaseAdmin.from('bookings').select('status').eq('box_id', boxId).gte('booked_at', thirtyDaysAgo),
    supabaseAdmin.from('check_ins').select('id', { count: 'exact', head: true }).eq('box_id', boxId).gte('checked_in_at', sevenDaysAgo),
    supabaseAdmin.from('member_status_view').select('sport_status').eq('box_id', boxId),
    supabaseAdmin.from('personal_records').select('id', { count: 'exact', head: true }).eq('box_id', boxId).gte('achieved_at', monthStart),
    supabaseAdmin.from('wod_results').select('profile_id').eq('box_id', boxId).gte('created_at', monthStart),
  ]);

  // Comerciales
  const income30d = (payments30d.data ?? []).reduce((s, p) => s + p.amount_cents, 0);
  const activeCount = activeMembers.count ?? 0;
  const avgRevenuePerMember = activeCount > 0 ? income30d / activeCount : 0;

  const paymentsByProfile = new Map<string, number>();
  for (const p of allTimePayments.data ?? []) {
    paymentsByProfile.set(p.profile_id, (paymentsByProfile.get(p.profile_id) ?? 0) + p.amount_cents);
  }
  const ltv =
    paymentsByProfile.size > 0
      ? Array.from(paymentsByProfile.values()).reduce((s, v) => s + v, 0) / paymentsByProfile.size
      : 0;

  // Operativos
  const classes = classes30d.data ?? [];
  const occupancyRates = classes.map((c: any) => {
    const active = (c.bookings ?? []).filter((b: any) => b.status !== 'cancelled' && b.status !== 'waitlisted').length;
    return c.capacity > 0 ? active / c.capacity : 0;
  });
  const avgOccupancy = occupancyRates.length > 0 ? (occupancyRates.reduce((s, v) => s + v, 0) / occupancyRates.length) * 100 : 0;

  const hourCounts = new Map<number, number>();
  for (const c of classes as any[]) {
    const hour = new Date(c.starts_at).getHours();
    const active = (c.bookings ?? []).filter((b: any) => b.status !== 'cancelled').length;
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + active);
  }
  const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const bookingStatuses = bookings30d.data ?? [];
  const totalBookings = bookingStatuses.length;
  const noShowCount = bookingStatuses.filter((b: any) => b.status === 'no_show').length;
  const cancelledCount = bookingStatuses.filter((b: any) => b.status === 'cancelled').length;
  const waitlistedCount = bookingStatuses.filter((b: any) => b.status === 'waitlisted').length;
  const noShowRate = totalBookings > 0 ? (noShowCount / totalBookings) * 100 : 0;

  // Retención
  const weeklyFrequency = activeCount > 0 ? ((checkins7d.count ?? 0) / activeCount).toFixed(1) : '0';
  const riskCounts = { at_risk: 0, critical: 0 };
  for (const r of riskMembers.data ?? []) {
    if (r.sport_status === 'at_risk') riskCounts.at_risk++;
    if (r.sport_status === 'critical') riskCounts.critical++;
  }

  // Deportivos
  const participantsSet = new Set((wodParticipants.data ?? []).map((r: any) => r.profile_id));
  const participationRate = activeCount > 0 ? (participantsSet.size / activeCount) * 100 : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">KPIs</h1>
        <p className="text-secondary text-sm">Ventana de los últimos 30 días, salvo donde se indique</p>
      </div>

      <Section title="Comerciales">
        <Stat label="Miembros activos" value={activeCount} />
        <Stat label="Nuevos (30 días)" value={newMembers.count ?? 0} />
        <Stat label="Ingresos (30 días)" value={formatCOP(income30d)} />
        <Stat label="Ingreso promedio / atleta" value={formatCOP(avgRevenuePerMember)} />
        <Stat label="LTV (histórico)" value={formatCOP(ltv)} sub="Pago total promedio por atleta, desde siempre" />
      </Section>

      <Section title="Operativos">
        <Stat label="Ocupación promedio" value={`${avgOccupancy.toFixed(0)}%`} sub="Últimas clases dictadas" />
        <Stat label="Horario más demandado" value={peakHour ? `${peakHour[0]}:00` : '—'} />
        <Stat label="Tasa de no-show" value={`${noShowRate.toFixed(0)}%`} />
        <Stat label="Cancelaciones (30 días)" value={cancelledCount} />
        <Stat label="Uso de lista de espera" value={waitlistedCount} />
      </Section>

      <Section title="Retención">
        <Stat label="Frecuencia semanal" value={weeklyFrequency} sub="Check-ins por atleta activo, últimos 7 días" />
        <Stat label="En riesgo" value={riskCounts.at_risk} sub="15-29 días sin asistir" />
        <Stat label="Crítico" value={riskCounts.critical} sub="30+ días sin asistir" />
      </Section>

      <Section title="Deportivos">
        <Stat label="PRs este mes" value={prsThisMonth.count ?? 0} />
        <Stat label="Participación en WODs" value={`${participationRate.toFixed(0)}%`} sub="Atletas con al menos un resultado este mes" />
      </Section>
    </div>
  );
}
