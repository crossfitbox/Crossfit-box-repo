'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createFamilyGroup(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para crear grupos familiares');
  }

  await supabaseAdmin.from('family_groups').insert({
    box_id: session.boxId,
    name: formData.get('name'),
  });

  revalidatePath('/familias');
}

export async function addFamilyMember(groupId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para editar grupos familiares');
  }

  await supabaseAdmin.from('family_members').insert({
    family_group_id: groupId,
    profile_id: formData.get('profile_id'),
  });

  revalidatePath('/familias');
}
