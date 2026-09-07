'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

/**
 * Ajuste manual de créditos (positivo o negativo). El motivo es
 * obligatorio — a diferencia de los movimientos automáticos
 * (reserva, check-in, devolución), un ajuste manual siempre debe
 * poder explicarse, porque es la excepción a la regla, no el flujo
 * normal.
 */
export async function adjustCredits(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'credits', 'create'))) {
    throw new Error('No tienes permiso para ajustar créditos');
  }

  const profileId = formData.get('profile_id') as string;
  const delta = Number(formData.get('delta'));
  const reason = (formData.get('reason') as string)?.trim();

  if (!profileId || !delta || !reason) {
    throw new Error('Faltan datos: atleta, cantidad y motivo son obligatorios');
  }

  await supabaseAdmin.from('credit_ledger').insert({
    box_id: session.boxId,
    profile_id: profileId,
    delta,
    reason: 'manual_adjustment',
    note: reason,
    created_by: session.userId,
  });

  // El ajuste queda además en auditoría general (credit_ledger ya es
  // su propio historial, pero audit_log es el lugar único donde el
  // owner revisa TODOS los cambios críticos del box, no solo créditos).
  await supabaseAdmin.from('audit_log').insert({
    box_id: session.boxId,
    actor_profile_id: session.userId,
    action: 'adjust',
    entity_type: 'credit',
    entity_id: profileId,
    field_changed: 'balance',
    new_value: { delta },
    reason,
  });

  revalidatePath('/creditos');
}
