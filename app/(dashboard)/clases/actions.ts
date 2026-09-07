'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createClass(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'create'))) {
    throw new Error('No tienes permiso para crear clases');
  }

  await supabaseAdmin.from('classes').insert({
    box_id: session.boxId,
    location_id: formData.get('location_id'),
    class_type_id: formData.get('class_type_id') || null,
    coach_id: formData.get('coach_id') || null,
    starts_at: formData.get('starts_at'),
    ends_at: formData.get('ends_at'),
    capacity: Number(formData.get('capacity')) || 15,
  });

  revalidatePath('/clases');
  redirect('/clases');
}

export async function updateClass(classId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'edit'))) {
    throw new Error('No tienes permiso para editar clases');
  }

  await supabaseAdmin
    .from('classes')
    .update({
      location_id: formData.get('location_id'),
      class_type_id: formData.get('class_type_id') || null,
      coach_id: formData.get('coach_id') || null,
      starts_at: formData.get('starts_at'),
      ends_at: formData.get('ends_at'),
      capacity: Number(formData.get('capacity')) || 15,
    })
    .eq('id', classId)
    .eq('box_id', session.boxId);

  revalidatePath('/clases');
  redirect('/clases');
}

export async function deleteClass(classId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'delete'))) {
    throw new Error('No tienes permiso para borrar clases');
  }

  await supabaseAdmin.from('classes').delete().eq('id', classId).eq('box_id', session.boxId);

  revalidatePath('/clases');
}
