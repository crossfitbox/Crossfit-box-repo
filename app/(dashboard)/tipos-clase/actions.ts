'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createClassType(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'classes', 'create'))) {
    throw new Error('No tienes permiso para crear tipos de clase');
  }

  await supabaseAdmin.from('class_types').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    service_id: formData.get('service_id') || null,
    is_open_box: formData.get('is_open_box') === 'on',
    requires_supervision: formData.get('requires_supervision') === 'on',
  });

  revalidatePath('/tipos-clase');
}
