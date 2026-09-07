import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { ExpenseForm } from '../../expense-form';
import { createExpense } from '../../actions';

export default async function NewExpensePage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'expenses', 'create'))) {
    redirect('/finanzas');
  }

  const { data: categories } = await supabaseAdmin
    .from('expense_categories')
    .select('id, name')
    .eq('box_id', session.boxId);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Registrar gasto</h1>
      <ExpenseForm action={createExpense} categories={categories ?? []} submitLabel="Guardar" />
    </div>
  );
}
