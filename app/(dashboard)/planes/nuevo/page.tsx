import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { PlanForm } from '../plan-form';
import { createPlan } from '../actions';

export default async function NewPlanPage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'plans', 'create'))) {
    redirect('/planes');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Nuevo plan</h1>
      <PlanForm action={createPlan} submitLabel="Crear plan" />
    </div>
  );
}
