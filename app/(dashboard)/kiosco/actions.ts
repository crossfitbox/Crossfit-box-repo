'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

export async function createKioskToken(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner' && session.role !== 'admin') {
    throw new Error('No tienes permiso para crear dispositivos de kiosco');
  }

  await supabaseAdmin.from('kiosk_tokens').insert({
    box_id: session.boxId,
    location_id: formData.get('location_id') || null,
    label: formData.get('label'),
  });

  revalidatePath('/kiosco');
}

export async function revokeKioskToken(tokenId: string) {
  const session = await requireStaffSession();
  if (session.role !== 'owner' && session.role !== 'admin') {
    throw new Error('No tienes permiso para revocar dispositivos');
  }

  await supabaseAdmin.from('kiosk_tokens').update({ active: false }).eq('id', tokenId).eq('box_id', session.boxId);
  revalidatePath('/kiosco');
}
