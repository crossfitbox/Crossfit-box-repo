'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createReceivable(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'finance', 'create'))) {
    throw new Error('No tienes permiso para crear cuentas por cobrar');
  }

  const amountCents = Math.round(Number(formData.get('amount')) * 100);

  await supabaseAdmin.from('receivables').insert({
    box_id: session.boxId,
    profile_id: formData.get('profile_id'),
    description: formData.get('description'),
    original_amount_cents: amountCents,
    balance_cents: amountCents,
    due_date: formData.get('due_date'),
  });

  revalidatePath('/cobros');
}

export async function applyPayment(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'finance', 'create'))) {
    throw new Error('No tienes permiso para registrar pagos');
  }

  const receivableId = formData.get('receivable_id') as string;
  const amountCents = Math.round(Number(formData.get('amount')) * 100);

  const { data: receivable } = await supabaseAdmin
    .from('receivables')
    .select('profile_id')
    .eq('id', receivableId)
    .single();

  await supabaseAdmin.from('payments').insert({
    box_id: session.boxId,
    profile_id: receivable?.profile_id,
    amount_cents: amountCents,
    method: formData.get('method') || 'cash',
    status: 'paid',
    receivable_id: receivableId,
  });
  // El trigger apply_payment_to_receivable() en Postgres se encarga
  // de descontar el saldo y actualizar el estado — no se toca a mano.

  revalidatePath('/cobros');
}
