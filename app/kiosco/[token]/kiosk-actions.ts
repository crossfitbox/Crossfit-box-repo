'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Estas acciones NO pasan por requireStaffSession() — el kiosco no
 * tiene un usuario logueado, tiene un token de dispositivo. Cada
 * función revalida el token contra kiosk_tokens antes de tocar
 * cualquier dato, para que un token robado/revocado no sirva.
 */
async function validateKioskToken(kioskTokenId: string) {
  const { data } = await supabaseAdmin
    .from('kiosk_tokens')
    .select('box_id, location_id, active')
    .eq('id', kioskTokenId)
    .eq('active', true)
    .maybeSingle();

  if (!data) throw new Error('Dispositivo no autorizado');
  return data;
}

export async function searchMemberByName(kioskTokenId: string, query: string) {
  const { box_id } = await validateKioskToken(kioskTokenId);

  const { data } = await supabaseAdmin
    .from('box_members')
    .select('profile_id, profiles(full_name)')
    .eq('box_id', box_id)
    .eq('role', 'athlete')
    .eq('status', 'active')
    .ilike('profiles.full_name', `%${query}%`)
    .limit(8);

  return (data ?? []).map((m: any) => ({ profileId: m.profile_id, name: m.profiles?.full_name ?? '—' }));
}

export async function kioskCheckIn(kioskTokenId: string, profileId: string) {
  const { box_id, location_id } = await validateKioskToken(kioskTokenId);

  // Busca si el atleta tiene una reserva "booked" en una clase que
  // esté ocurriendo ahora mismo, para vincular el check-in a ella.
  const now = new Date().toISOString();
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, class_id, classes!inner(starts_at, ends_at)')
    .eq('profile_id', profileId)
    .eq('status', 'booked')
    .lte('classes.starts_at', now)
    .gte('classes.ends_at', now)
    .maybeSingle();

  await supabaseAdmin.from('check_ins').insert({
    booking_id: booking?.id ?? null,
    box_id,
    profile_id: profileId,
    location_id,
    method: 'manual', // el kiosco cuenta como check-in manual asistido, no QR/app
  });

  return { success: true };
}
