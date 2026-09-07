import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { LocationForm } from '../location-form';
import { createLocation } from '../actions';

export default async function NewLocationPage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'locations', 'create'))) {
    redirect('/sedes');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Nueva sede</h1>
      <LocationForm action={createLocation} submitLabel="Crear sede" />
    </div>
  );
}
