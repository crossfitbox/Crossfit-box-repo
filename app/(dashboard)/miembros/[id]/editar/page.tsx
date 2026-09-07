import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { updateMember } from '../../actions';
import { FreezeForm } from './freeze-form';

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    redirect('/miembros');
  }

  const { data: member } = await supabaseAdmin
    .from('box_members')
    .select('id, profile_id, role, status, profiles(full_name)')
    .eq('id', params.id)
    .eq('box_id', session.boxId)
    .maybeSingle();

  if (!member) notFound();

  const { data: freezes } = await supabaseAdmin
    .from('membership_freezes')
    .select('id, starts_on, ends_on, reason')
    .eq('profile_id', member.profile_id)
    .order('starts_on', { ascending: false });

  const { data: customRoles } = await supabaseAdmin
    .from('custom_roles')
    .select('name, label')
    .eq('box_id', session.boxId);

  const updateWithId = updateMember.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-1">Editar miembro</h1>
      <p className="text-secondary text-sm mb-6">
        {(member as any).profiles?.full_name}
      </p>

      <form action={updateWithId} className="max-w-sm flex flex-col gap-4">
        <div>
          <label className="block text-sm text-secondary mb-1">Rol</label>
          <select
            name="role"
            defaultValue={member.role}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          >
            <option value="athlete">Atleta</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
            {(customRoles ?? []).map((r) => (
              <option key={r.name} value={r.name}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Estado</label>
          <select
            name="status"
            defaultValue={member.status}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          >
            <option value="active">Activo</option>
            <option value="frozen">Congelado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start"
        >
          Guardar cambios
        </button>
      </form>

      <div className="mt-10 max-w-sm">
        <h2 className="font-display text-sm font-medium mb-3">Congelar membresía</h2>
        <FreezeForm profileId={member.profile_id} />

        {(freezes ?? []).length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs text-secondary uppercase tracking-wide mb-2">
              Historial de congelamientos
            </h3>
            <div className="flex flex-col gap-2">
              {freezes!.map((f: any) => (
                <div key={f.id} className="text-sm text-secondary border-b border-border pb-2">
                  {new Date(f.starts_on).toLocaleDateString('es-CO')} →{' '}
                  {new Date(f.ends_on).toLocaleDateString('es-CO')}
                  {f.reason && <span className="block text-xs">{f.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
