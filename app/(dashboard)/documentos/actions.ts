'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createDocumentVersion(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para publicar documentos');
  }

  const type = formData.get('type') as string;

  const { data: latest } = await supabaseAdmin
    .from('document_templates')
    .select('version')
    .eq('box_id', session.boxId)
    .eq('type', type)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  // La versión anterior del mismo tipo se desactiva — los atletas que
  // ya aceptaron la vieja mantienen su historial, pero a partir de
  // ahora se les pedirá aceptar la nueva si "required" está activo.
  await supabaseAdmin
    .from('document_templates')
    .update({ active: false })
    .eq('box_id', session.boxId)
    .eq('type', type);

  await supabaseAdmin.from('document_templates').insert({
    box_id: session.boxId,
    type,
    title: formData.get('title'),
    version: nextVersion,
    content: formData.get('content'),
    required: formData.get('required') === 'on',
    active: true,
  });

  revalidatePath('/documentos');
}
