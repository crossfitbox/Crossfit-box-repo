import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { LocationForm } from '../../location-form';
import { updateLocation } from '../../actions';

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'locations', 'edit'))) {
    redirect('/sedes');
  }

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('id, name, address, phone, is_primary')
    .eq('id', params.id)
    .eq('box_id', session.boxId)
    .maybeSingle();

  if (!location) notFound();

  const updateWithId = updateLocation.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Editar sede</h1>
      <LocationForm action={updateWithId} initial={location} submitLabel="Guardar cambios" />
    </div>
  );
}
