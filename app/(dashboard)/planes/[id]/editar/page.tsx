import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { PlanForm } from '../../plan-form';
import { updatePlan } from '../../actions';

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'plans', 'edit'))) {
    redirect('/planes');
  }

  const { data: plan } = await supabaseAdmin
    .from('membership_plans')
    .select('id, name, classes_per_period, price_cents, currency, period, active')
    .eq('id', params.id)
    .eq('box_id', session.boxId)
    .maybeSingle();

  if (!plan) notFound();

  const updateWithId = updatePlan.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Editar plan</h1>
      <PlanForm action={updateWithId} initial={plan} submitLabel="Guardar cambios" />
    </div>
  );
}
