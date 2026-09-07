'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

/**
 * Registra la atribución referidor -> referido. El beneficio se
 * dispara solo — el trigger qualify_referral_on_first_payment() en
 * Postgres detecta el primer pago del referido y ahí marca
 * "qualified" y entrega los créditos, nunca antes.
 */
export async function createReferral(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para registrar referidos');
  }

  const { error } = await supabaseAdmin.from('referrals').insert({
    box_id: session.boxId,
    referrer_profile_id: formData.get('referrer_id'),
    referred_profile_id: formData.get('referred_id'),
    reward_credits: Number(formData.get('reward_credits') || 0),
  });

  if (error) throw new Error(error.message);

  revalidatePath('/referidos');
}
