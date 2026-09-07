'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createPlan(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'plans', 'create'))) {
    throw new Error('No tienes permiso para crear planes');
  }

  const classesPerPeriod = formData.get('classes_per_period');

  await supabaseAdmin.from('membership_plans').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    classes_per_period: classesPerPeriod ? Number(classesPerPeriod) : null,
    price_cents: Math.round(Number(formData.get('price')) * 100),
    currency: formData.get('currency') || 'COP',
    period: formData.get('period'),
    active: formData.get('active') === 'on',
  });

  revalidatePath('/planes');
  redirect('/planes');
}

export async function updatePlan(planId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'plans', 'edit'))) {
    throw new Error('No tienes permiso para editar planes');
  }

  const classesPerPeriod = formData.get('classes_per_period');

  await supabaseAdmin
    .from('membership_plans')
    .update({
      name: formData.get('name'),
      classes_per_period: classesPerPeriod ? Number(classesPerPeriod) : null,
      price_cents: Math.round(Number(formData.get('price')) * 100),
      currency: formData.get('currency') || 'COP',
      period: formData.get('period'),
      active: formData.get('active') === 'on',
    })
    .eq('id', planId)
    .eq('box_id', session.boxId);

  revalidatePath('/planes');
  redirect('/planes');
}

export async function deletePlan(planId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'plans', 'delete'))) {
    throw new Error('No tienes permiso para borrar planes');
  }

  await supabaseAdmin
    .from('membership_plans')
    .delete()
    .eq('id', planId)
    .eq('box_id', session.boxId);

  revalidatePath('/planes');
}
