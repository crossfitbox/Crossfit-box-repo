import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Lookup público (sin API key) — el login lo llama ANTES de que el
 * usuario esté autenticado, así que no puede pasar por RLS normal.
 * Solo devuelve si el dominio usa SSO y el provider_id; nunca datos
 * sensibles del box.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain) return NextResponse.json({ sso: false });

  const { data } = await supabaseAdmin
    .from('sso_domains')
    .select('sso_provider_id, enforce')
    .eq('email_domain', domain.toLowerCase())
    .eq('active', true)
    .maybeSingle();

  if (!data || !data.enforce) return NextResponse.json({ sso: false });

  return NextResponse.json({ sso: true, providerId: data.sso_provider_id });
}
