'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createDiscount(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear descuentos');
  }

  const type = formData.get('type') as string;
  const rawValue = Number(formData.get('value'));

  await supabaseAdmin.from('discounts').insert({
    box_id: session.boxId,
    code: formData.get('code') || null,
    type,
    value: type === 'fixed' ? Math.round(rawValue * 100) : rawValue, // fixed en centavos, percentage tal cual
    plan_id: formData.get('plan_id') || null,
    stackable: formData.get('stackable') === 'on',
    valid_from: formData.get('valid_from') || null,
    valid_until: formData.get('valid_until') || null,
    created_by: session.userId,
  });

  revalidatePath('/descuentos');
}

/** Aplica un descuento existente a un atleta (redención manual). */
export async function redeemDiscount(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para aplicar descuentos');
  }

  await supabaseAdmin.from('discount_redemptions').insert({
    box_id: session.boxId,
    discount_id: formData.get('discount_id'),
    profile_id: formData.get('profile_id'),
    authorized_by: session.userId,
  });

  await supabaseAdmin.from('audit_log').insert({
    box_id: session.boxId,
    actor_profile_id: session.userId,
    action: 'create',
    entity_type: 'discount_redemption',
    reason: 'Descuento aplicado manualmente',
  });

  revalidatePath('/descuentos');
}
