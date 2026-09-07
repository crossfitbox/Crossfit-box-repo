import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateApiRequest, requireScope } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'write');
  if (scopeError) return scopeError;

  const body = await req.json();
  const { class_id, profile_id } = body;

  if (!class_id || !profile_id) {
    return NextResponse.json({ error: 'class_id y profile_id son obligatorios' }, { status: 400 });
  }

  // Verificar que el profile realmente pertenece a este box — una API
  // key nunca debe poder reservar a nombre de un atleta ajeno.
  const { data: membership } = await supabaseAdmin
    .from('box_members')
    .select('id')
    .eq('box_id', auth.boxId)
    .eq('profile_id', profile_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Ese profile_id no pertenece a este box' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({ box_id: auth.boxId, class_id, profile_id, status: 'booked' })
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
