import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { ClassForm } from '../../class-form';
import { updateClass } from '../../actions';

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'edit'))) {
    redirect('/clases');
  }

  const [classRes, classTypes, coaches, locations] = await Promise.all([
    supabaseAdmin
      .from('classes')
      .select('id, class_type_id, coach_id, location_id, starts_at, ends_at, capacity')
      .eq('id', params.id)
      .eq('box_id', session.boxId)
      .maybeSingle(),
    supabaseAdmin.from('class_types').select('id, name').eq('box_id', session.boxId),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(id, full_name)')
      .eq('box_id', session.boxId)
      .eq('role', 'coach'),
    supabaseAdmin.from('locations').select('id, name').eq('box_id', session.boxId),
  ]);

  if (!classRes.data) notFound();

  const coachOptions = (coaches.data ?? []).map((c: any) => ({
    id: c.profiles.id,
    full_name: c.profiles.full_name,
  }));

  const updateWithId = updateClass.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Editar clase</h1>
      <ClassForm
        action={updateWithId}
        classTypes={classTypes.data ?? []}
        coaches={coachOptions}
        locations={locations.data ?? []}
        initial={classRes.data}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
