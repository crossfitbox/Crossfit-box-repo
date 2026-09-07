'use server';

import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

/**
 * Genera una API key nueva. La llave real (con prefijo "box_live_")
 * se muestra UNA sola vez en el resultado — solo se guarda su hash
 * SHA-256, igual que una contraseña. Si el usuario la pierde, hay que
 * revocar y crear una nueva.
 */
export async function createApiKey(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear API keys');
  }

  const rawKey = `box_live_${crypto.randomBytes(24).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const scopes = formData.getAll('scopes');

  await supabaseAdmin.from('api_keys').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    key_hash: hash,
    key_prefix: rawKey.slice(0, 16),
    scopes: scopes.length > 0 ? scopes : ['read'],
    created_by: session.userId,
  });

  revalidatePath('/desarrolladores');
  return rawKey; // única vez que se devuelve en texto plano
}

export async function revokeApiKey(keyId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para revocar API keys');
  }

  await supabaseAdmin.from('api_keys').update({ revoked: true }).eq('id', keyId).eq('box_id', session.boxId);
  revalidatePath('/desarrolladores');
}

export async function createWebhook(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear webhooks');
  }

  const events = formData.getAll('events');

  await supabaseAdmin.from('webhooks').insert({
    box_id: session.boxId,
    url: formData.get('url'),
    events,
  });

  revalidatePath('/desarrolladores');
}

export async function deleteWebhook(webhookId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para borrar webhooks');
  }

  await supabaseAdmin.from('webhooks').delete().eq('id', webhookId).eq('box_id', session.boxId);
  revalidatePath('/desarrolladores');
}
