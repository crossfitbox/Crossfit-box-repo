'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from './supabase-admin';
import { createServerSupabaseClient } from './supabase-server';

/**
 * Cambia el box activo del staff logueado. Verifica que el usuario
 * realmente pertenezca a ese box ANTES de fijar la cookie — nunca
 * confíes en el boxId que llega del cliente sin validarlo contra
 * box_members, o cualquiera podría intentar fijar un box ajeno.
 */
export async function switchActiveBox(boxId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: membership } = await supabaseAdmin
    .from('box_members')
    .select('box_id')
    .eq('profile_id', user.id)
    .eq('box_id', boxId)
    .in('role', ['coach', 'admin', 'owner'])
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    throw new Error('No perteneces a ese box');
  }

  cookies().set('active_box_id', boxId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect('/');
}
