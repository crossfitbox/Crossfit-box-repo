import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { WodForm } from '../wod-form';
import { createWod } from '../actions';

export default async function NewWodPage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'wods', 'create'))) {
    redirect('/wods');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Publicar WOD</h1>
      <WodForm action={createWod} submitLabel="Publicar" />
    </div>
  );
}
