import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewFamilyGroupForm, AddFamilyMemberForm } from './family-forms';

export default async function FamiliesPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [groupsRes, membersRes] = await Promise.all([
    supabaseAdmin
      .from('family_groups')
      .select('id, name, family_members(profile_id, profiles(full_name))')
      .eq('box_id', session.boxId)
      .order('name'),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('status', 'active'),
  ]);

  const members = (membersRes.data ?? []).map((m: any) => ({
    profileId: m.profile_id,
    name: m.profiles?.full_name ?? '—',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Membresías familiares</h1>
          <p className="text-secondary text-sm">
            Agrupa atletas de una misma familia — el descuento se aplica manualmente
            en Descuentos al momento de facturar, según cuántos estén activos
          </p>
        </div>
        {perms.members.edit && <NewFamilyGroupForm />}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {(groupsRes.data ?? []).map((g: any) => (
          <div key={g.id} className="border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-primary">{g.name}</h2>
              <span className="text-xs text-secondary">
                {(g.family_members ?? []).length} miembros
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {(g.family_members ?? []).map((fm: any) => (
                <div key={fm.profile_id} className="text-sm text-secondary">
                  {fm.profiles?.full_name}
                </div>
              ))}
              {(g.family_members ?? []).length === 0 && (
                <div className="text-sm text-secondary">Sin miembros todavía</div>
              )}
            </div>
            {perms.members.edit && <AddFamilyMemberForm groupId={g.id} members={members} />}
          </div>
        ))}
        {(groupsRes.data ?? []).length === 0 && (
          <p className="text-secondary text-sm col-span-2 py-6">
            Sin grupos familiares creados todavía
          </p>
        )}
      </div>
    </div>
  );
}
