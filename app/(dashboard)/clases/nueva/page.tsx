import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { ClassForm } from '../class-form';
import { createClass } from '../actions';

export default async function NewClassPage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'create'))) {
    redirect('/clases');
  }

  const [classTypes, coaches, locations] = await Promise.all([
    supabaseAdmin.from('class_types').select('id, name').eq('box_id', session.boxId),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(id, full_name)')
      .eq('box_id', session.boxId)
      .eq('role', 'coach'),
    supabaseAdmin.from('locations').select('id, name').eq('box_id', session.boxId),
  ]);

  const coachOptions = (coaches.data ?? []).map((c: any) => ({
    id: c.profiles.id,
    full_name: c.profiles.full_name,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Nueva clase</h1>
      <ClassForm
        action={createClass}
        classTypes={classTypes.data ?? []}
        coaches={coachOptions}
        locations={locations.data ?? []}
        submitLabel="Crear clase"
      />
    </div>
  );
}
