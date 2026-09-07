'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

/**
 * Sobrescribe la matriz de permisos completa para el box. Solo el
 * owner puede llegar hasta acá (ver page.tsx, que redirige a
 * cualquier otro rol antes de renderizar el formulario) — pero se
 * verifica también aquí, porque un Server Action es un endpoint
 * público y nunca hay que confiar solo en que la UI lo ocultó.
 */
export async function savePermissionMatrix(matrixJson: string) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede modificar los permisos');
  }

  const rows = JSON.parse(matrixJson) as Array<{
    role: string;
    resource: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;

  for (const row of rows) {
    await supabaseAdmin.from('role_permissions').upsert(
      {
        box_id: session.boxId,
        role: row.role,
        resource: row.resource,
        can_view: row.can_view,
        can_create: row.can_create,
        can_edit: row.can_edit,
        can_delete: row.can_delete,
      },
      { onConflict: 'box_id,role,resource' },
    );
  }

  revalidatePath('/roles');
}

export async function createCustomRole(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede crear roles personalizados');
  }

  const label = (formData.get('label') as string)?.trim();
  const name = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  if (!name) throw new Error('Nombre de rol inválido');

  await supabaseAdmin.from('custom_roles').insert({
    box_id: session.boxId,
    name,
    label,
  });

  revalidatePath('/roles');
}
