'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createPtPackage(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear paquetes de PT');
  }

  await supabaseAdmin.from('pt_packages').insert({
    box_id: session.boxId,
    profile_id: formData.get('profile_id'),
    coach_id: formData.get('coach_id') || null,
    total_sessions: Number(formData.get('total_sessions')),
    expires_at: formData.get('expires_at') || null,
  });

  revalidatePath('/personal-training');
}

export async function scheduleSession(packageId: string, formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para agendar sesiones');
  }

  await supabaseAdmin.from('pt_sessions').insert({
    package_id: packageId,
    box_id: session.boxId,
    scheduled_at: formData.get('scheduled_at'),
  });

  revalidatePath('/personal-training');
}

export async function completeSession(sessionId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para marcar sesiones');
  }

  // El trigger consume_pt_session() en Postgres descuenta del paquete
  // automáticamente al ver el cambio a 'completed'.
  await supabaseAdmin.from('pt_sessions').update({ status: 'completed' }).eq('id', sessionId);

  revalidatePath('/personal-training');
}
