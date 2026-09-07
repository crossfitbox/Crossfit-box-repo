import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { WodForm } from '../../wod-form';
import { updateWod } from '../../actions';

export default async function EditWodPage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'wods', 'edit'))) {
    redirect('/wods');
  }

  const { data: wod } = await supabaseAdmin
    .from('wods')
    .select('id, date, title, description, score_type')
    .eq('id', params.id)
    .eq('box_id', session.boxId)
    .maybeSingle();

  if (!wod) notFound();

  const updateWithId = updateWod.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Editar WOD</h1>
      <WodForm action={updateWithId} initial={wod} submitLabel="Guardar cambios" />
    </div>
  );
}
