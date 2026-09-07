'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createWod(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'wods', 'create'))) {
    throw new Error('No tienes permiso para publicar WODs');
  }

  await supabaseAdmin.from('wods').insert({
    box_id: session.boxId,
    date: formData.get('date'),
    title: formData.get('title') || null,
    description: formData.get('description'),
    score_type: formData.get('score_type'),
  });

  revalidatePath('/wods');
  redirect('/wods');
}

export async function updateWod(wodId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'wods', 'edit'))) {
    throw new Error('No tienes permiso para editar WODs');
  }

  await supabaseAdmin
    .from('wods')
    .update({
      date: formData.get('date'),
      title: formData.get('title') || null,
      description: formData.get('description'),
      score_type: formData.get('score_type'),
    })
    .eq('id', wodId)
    .eq('box_id', session.boxId);

  revalidatePath('/wods');
  redirect('/wods');
}

export async function deleteWod(wodId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'wods', 'delete'))) {
    throw new Error('No tienes permiso para borrar WODs');
  }

  await supabaseAdmin.from('wods').delete().eq('id', wodId).eq('box_id', session.boxId);
  revalidatePath('/wods');
}
