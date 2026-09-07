import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';

export interface BrandSession {
  userId: string;
  brandId: string;
  brandName: string;
  role: 'brand_admin' | 'brand_owner';
}

/**
 * Sesión a nivel de MARCA — para el staff que gestiona una cadena de
 * boxes, no uno solo. Es independiente de requireStaffSession(): un
 * usuario puede tener ambas (staff de un box específico Y admin de
 * marca), o solo una de las dos.
 */
export async function requireBrandSession(): Promise<BrandSession> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabaseAdmin
    .from('brand_members')
    .select('brand_id, role, brands(name)')
    .eq('profile_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/');

  return {
    userId: user.id,
    brandId: membership.brand_id,
    brandName: (membership as any).brands?.name ?? 'Marca',
    role: membership.role,
  };
}
