'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requirePlatformAdmin } from '@/lib/require-platform-admin';

/**
 * Inicia una sesión de soporte: registra QUIÉN, SOBRE QUÉ BOX, y POR
 * QUÉ MOTIVO, antes de dejar entrar. El registro queda visible para
 * el owner del box (ver support_sessions RLS) — nadie entra a la
 * cuenta de un cliente sin que quede rastro que el cliente mismo
 * puede auditar.
 */
export async function startSupportSession(formData: FormData) {
  const { userId } = await requirePlatformAdmin();

  const boxId = formData.get('box_id') as string;
  const reason = (formData.get('reason') as string)?.trim();

  if (!reason) throw new Error('El motivo es obligatorio para impersonar un box');

  const { data: session } = await supabaseAdmin
    .from('support_sessions')
    .insert({ target_box_id: boxId, platform_admin_id: userId, reason })
    .select('id')
    .single();

  await supabaseAdmin.from('audit_log').insert({
    box_id: boxId,
    actor_profile_id: userId,
    action: 'create',
    entity_type: 'support_session',
    entity_id: session!.id,
    reason: `Soporte entró al box — motivo: ${reason}`,
  });

  // Fija el box activo igual que el selector normal, pero marca que
  // es una sesión de soporte para mostrarlo en el header.
  cookies().set('active_box_id', boxId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 4 });
  cookies().set('support_session_id', session!.id, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 4 });

  redirect('/');
}

export async function endSupportSession() {
  const sessionId = cookies().get('support_session_id')?.value;
  if (sessionId) {
    await supabaseAdmin.from('support_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId);
  }
  cookies().delete('support_session_id');
  cookies().delete('active_box_id');
  redirect('/soporte');
}
