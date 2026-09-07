import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { ExpenseForm } from '../../../expense-form';
import { updateExpense } from '../../../actions';

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const session = await requireStaffSession();
  if (!(await can(session, 'expenses', 'edit'))) {
    redirect('/finanzas');
  }

  const [expenseRes, categoriesRes] = await Promise.all([
    supabaseAdmin
      .from('expenses')
      .select('id, category_id, description, amount_cents, currency, expense_date, recurring')
      .eq('id', params.id)
      .eq('box_id', session.boxId)
      .maybeSingle(),
    supabaseAdmin.from('expense_categories').select('id, name').eq('box_id', session.boxId),
  ]);

  if (!expenseRes.data) notFound();

  const updateWithId = updateExpense.bind(null, params.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Editar gasto</h1>
      <ExpenseForm
        action={updateWithId}
        categories={categoriesRes.data ?? []}
        initial={expenseRes.data}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
