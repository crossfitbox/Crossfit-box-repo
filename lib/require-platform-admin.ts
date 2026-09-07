import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';

/**
 * Distinto de requireStaffSession (staff de un box) y de
 * requireBrandSession (staff de una marca/franquicia) — esto es
 * para EL EQUIPO QUE OPERA EL SAAS, verificando la tabla
 * platform_admins. En una implementación real, esta tabla se llena a
 * mano desde el dashboard de Supabase (nunca desde un formulario
 * público) — no hay flujo de "auto-registro" como platform admin.
 */
export async function requirePlatformAdmin(): Promise<{ userId: string }> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data } = await supabaseAdmin
    .from('platform_admins')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!data) redirect('/');

  return { userId: user.id };
}
