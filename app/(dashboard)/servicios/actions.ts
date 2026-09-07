'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createService(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear servicios');
  }

  await supabaseAdmin.from('services').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    description: formData.get('description') || null,
  });

  revalidatePath('/servicios');
}
