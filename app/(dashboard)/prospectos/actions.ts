'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { STAGES, type Stage } from './constants';

export async function createLead(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'leads', 'create'))) {
    throw new Error('No tienes permiso para crear prospectos');
  }

  await supabaseAdmin.from('leads').insert({
    box_id: session.boxId,
    full_name: formData.get('full_name'),
    phone: formData.get('phone') || null,
    email: formData.get('email') || null,
    source: formData.get('source') || 'walk_in',
    notes: formData.get('notes') || null,
    assigned_to: session.userId,
  });

  revalidatePath('/prospectos');
  redirect('/prospectos');
}

/** Avanza un prospecto a la siguiente etapa del pipeline. */
export async function advanceStage(leadId: string, currentStage: Stage) {
  const session = await requireStaffSession();
  if (!(await can(session, 'leads', 'edit'))) {
    throw new Error('No tienes permiso para mover prospectos');
  }

  const idx = STAGES.indexOf(currentStage as (typeof STAGES)[number]);
  const next = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : currentStage;

  await supabaseAdmin
    .from('leads')
    .update({ stage: next, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('box_id', session.boxId);

  revalidatePath('/prospectos');
}

/** Marca un prospecto como perdido. */
export async function markLost(leadId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'leads', 'edit'))) {
    throw new Error('No tienes permiso para mover prospectos');
  }

  await supabaseAdmin
    .from('leads')
    .update({ stage: 'lost', updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('box_id', session.boxId);

  revalidatePath('/prospectos');
}

/** Borra un prospecto definitivamente (distinto de marcarlo "perdido"). */
export async function deleteLead(leadId: string) {
  const session = await requireStaffSession();
  if (!(await can(session, 'leads', 'delete'))) {
    throw new Error('No tienes permiso para borrar prospectos');
  }

  await supabaseAdmin.from('leads').delete().eq('id', leadId).eq('box_id', session.boxId);
  revalidatePath('/prospectos');
}
