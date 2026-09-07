'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createGdprRequest(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para registrar solicitudes GDPR');
  }

  await supabaseAdmin.from('gdpr_requests').insert({
    box_id: session.boxId,
    profile_id: formData.get('profile_id'),
    request_type: formData.get('request_type'),
    requested_by: session.userId,
    notes: formData.get('notes') || null,
  });

  revalidatePath('/cumplimiento');
}

/**
 * Procesa una solicitud. Para "delete" anonimiza los datos personales
 * (nunca borra el historial financiero/deportivo, según la regla 1
 * del documento de negocio) — el borrado de la cuenta de Auth en sí
 * se hace aparte con supabase.auth.admin.deleteUser(), que no se
 * puede invocar desde una función de Postgres.
 */
export async function processGdprRequest(requestId: string, profileId: string, type: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'members', 'edit'))) {
    throw new Error('No tienes permiso para procesar solicitudes GDPR');
  }

  if (type === 'delete') {
    await supabaseAdmin.rpc('anonymize_member', { target_profile_id: profileId });
  }

  await supabaseAdmin
    .from('gdpr_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('box_id', session.boxId);

  await supabaseAdmin.from('audit_log').insert({
    box_id: session.boxId,
    actor_profile_id: session.userId,
    action: 'update',
    entity_type: 'gdpr_request',
    entity_id: requestId,
    reason: `Solicitud ${type === 'delete' ? 'de eliminación' : 'de exportación'} procesada`,
  });

  revalidatePath('/cumplimiento');
}

export async function setRetentionPolicy(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede definir políticas de retención');
  }

  await supabaseAdmin.from('data_retention_policies').upsert(
    {
      box_id: session.boxId,
      entity_type: formData.get('entity_type'),
      retain_days: Number(formData.get('retain_days')),
    },
    { onConflict: 'box_id,entity_type' },
  );

  revalidatePath('/cumplimiento');
}
