import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewPackageForm, ScheduleSessionForm, CompleteSessionButton } from './pt-forms';

export default async function PersonalTrainingPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [packagesRes, membersRes, coachesRes] = await Promise.all([
    supabaseAdmin
      .from('pt_packages')
      .select('id, total_sessions, sessions_used, expires_at, profiles!pt_packages_profile_id_fkey(full_name), coach:profiles!pt_packages_coach_id_fkey(full_name), pt_sessions(id, scheduled_at, status)')
      .eq('box_id', session.boxId)
      .order('purchased_at', { ascending: false }),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('role', 'athlete'),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('role', 'coach'),
  ]);

  const members = (membersRes.data ?? []).map((m: any) => ({ profileId: m.profile_id, name: m.profiles?.full_name ?? '—' }));
  const coaches = (coachesRes.data ?? []).map((c: any) => ({ profileId: c.profile_id, name: c.profiles?.full_name ?? '—' }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Personal Training</h1>
          <p className="text-secondary text-sm">Paquetes de sesiones individuales, independientes de las clases grupales</p>
        </div>
        {perms.settings.edit && <NewPackageForm members={members} coaches={coaches} />}
      </div>

      <div className="flex flex-col gap-4">
        {(packagesRes.data ?? []).map((p: any) => {
          const upcoming = (p.pt_sessions ?? []).filter((s: any) => s.status === 'scheduled');
          const remaining = p.total_sessions - p.sessions_used;

          return (
            <div key={p.id} className="border border-border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm text-primary">{p.profiles?.full_name}</span>
                  <span className="text-secondary text-xs ml-2">
                    {p.coach?.full_name ? `con ${p.coach.full_name}` : 'sin coach fijo'}
                  </span>
                </div>
                <span className={`pill ${remaining <= 1 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                  {remaining}/{p.total_sessions} sesiones
                </span>
              </div>

              {upcoming.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm text-secondary py-1 border-t border-border">
                  {new Date(s.scheduled_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {perms.settings.edit && <CompleteSessionButton sessionId={s.id} />}
                </div>
              ))}

              {perms.settings.edit && (
                <div className="mt-2">
                  <ScheduleSessionForm packageId={p.id} />
                </div>
              )}
            </div>
          );
        })}
        {(packagesRes.data ?? []).length === 0 && (
          <p className="text-secondary text-sm py-6">Sin paquetes de PT creados todavía</p>
        )}
      </div>
    </div>
  );
}
