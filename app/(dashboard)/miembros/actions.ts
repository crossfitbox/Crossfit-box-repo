'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function updateMember(memberId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para editar miembros');
  }

  await supabaseAdmin
    .from('box_members')
    .update({
      role: formData.get('role'),
      status: formData.get('status'),
    })
    .eq('id', memberId)
    .eq('box_id', session.boxId);

  revalidatePath('/miembros');
  redirect('/miembros');
}

export async function removeMember(memberId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'delete'))) {
    throw new Error('No tienes permiso para eliminar miembros');
  }

  await supabaseAdmin
    .from('box_members')
    .delete()
    .eq('id', memberId)
    .eq('box_id', session.boxId);

  revalidatePath('/miembros');
}

/**
 * Congela la membresía de un atleta. La validación de superposición
 * y la extensión del vencimiento las hace el trigger
 * apply_membership_freeze() en Postgres — aquí solo se inserta la
 * solicitud ya aprobada por el staff.
 */
export async function freezeMembership(profileId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para congelar membresías');
  }

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('box_id', session.boxId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('membership_freezes').insert({
    box_id: session.boxId,
    profile_id: profileId,
    subscription_id: subscription?.id ?? null,
    starts_on: formData.get('starts_on'),
    ends_on: formData.get('ends_on'),
    reason: formData.get('reason') || null,
    approved_by: session.userId,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/miembros');
}
