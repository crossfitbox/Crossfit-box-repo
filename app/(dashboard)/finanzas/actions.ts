'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createExpense(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'expenses', 'create'))) {
    throw new Error('No tienes permiso para registrar gastos');
  }

  await supabaseAdmin.from('expenses').insert({
    box_id: session.boxId,
    category_id: formData.get('category_id') || null,
    description: formData.get('description'),
    amount_cents: Math.round(Number(formData.get('amount')) * 100),
    currency: formData.get('currency') || 'COP',
    expense_date: formData.get('expense_date'),
    recurring: formData.get('recurring') === 'on',
    created_by: session.userId,
  });

  revalidatePath('/finanzas');
  redirect('/finanzas');
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'expenses', 'edit'))) {
    throw new Error('No tienes permiso para editar gastos');
  }

  await supabaseAdmin
    .from('expenses')
    .update({
      category_id: formData.get('category_id') || null,
      description: formData.get('description'),
      amount_cents: Math.round(Number(formData.get('amount')) * 100),
      currency: formData.get('currency') || 'COP',
      expense_date: formData.get('expense_date'),
      recurring: formData.get('recurring') === 'on',
    })
    .eq('id', expenseId)
    .eq('box_id', session.boxId);

  revalidatePath('/finanzas');
  redirect('/finanzas');
}

export async function deleteExpense(expenseId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'expenses', 'delete'))) {
    throw new Error('No tienes permiso para borrar gastos');
  }

  await supabaseAdmin
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('box_id', session.boxId);

  revalidatePath('/finanzas');
}
