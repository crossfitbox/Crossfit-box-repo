'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createLocation(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'locations', 'create'))) {
    throw new Error('No tienes permiso para crear sedes');
  }

  const isPrimary = formData.get('is_primary') === 'on';

  // Solo puede haber una sede marcada como principal por box.
  if (isPrimary) {
    await supabaseAdmin
      .from('locations')
      .update({ is_primary: false })
      .eq('box_id', session.boxId);
  }

  await supabaseAdmin.from('locations').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    address: formData.get('address') || null,
    phone: formData.get('phone') || null,
    is_primary: isPrimary,
  });

  revalidatePath('/sedes');
  redirect('/sedes');
}

export async function updateLocation(locationId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'locations', 'edit'))) {
    throw new Error('No tienes permiso para editar sedes');
  }

  const isPrimary = formData.get('is_primary') === 'on';

  if (isPrimary) {
    await supabaseAdmin
      .from('locations')
      .update({ is_primary: false })
      .eq('box_id', session.boxId);
  }

  await supabaseAdmin
    .from('locations')
    .update({
      name: formData.get('name'),
      address: formData.get('address') || null,
      phone: formData.get('phone') || null,
      is_primary: isPrimary,
    })
    .eq('id', locationId)
    .eq('box_id', session.boxId);

  revalidatePath('/sedes');
  redirect('/sedes');
}

export async function deleteLocation(locationId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'locations', 'delete'))) {
    throw new Error('No tienes permiso para borrar sedes');
  }

  // No dejar huérfanas las clases de esa sede — el borrado se
  // rechaza si tiene clases asociadas (protección simple; una
  // versión más completa ofrecería reasignarlas a otra sede).
  const { count } = await supabaseAdmin
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', locationId);

  if (count && count > 0) {
    throw new Error(
      'Esta sede tiene clases asociadas — reasígnalas antes de borrarla',
    );
  }

  await supabaseAdmin
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('box_id', session.boxId);

  revalidatePath('/sedes');
}
