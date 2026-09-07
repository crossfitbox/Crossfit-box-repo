import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase-admin';

export interface ApiAuthContext {
  boxId: string;
  scopes: string[];
}

/**
 * Valida el header `Authorization: Bearer box_live_...` contra
 * api_keys (vía la función verify_api_key, que compara el hash SHA-256
 * — la llave real nunca se guarda en la base de datos). Actualiza
 * last_used_at para que la página de Desarrolladores muestre uso real.
 */
export async function authenticateApiRequest(
  req: NextRequest,
): Promise<ApiAuthContext | NextResponse> {
  const auth = req.headers.get('authorization');
  const key = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!key) {
    return NextResponse.json({ error: 'Falta el header Authorization: Bearer <api_key>' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.rpc('verify_api_key', { raw_key: key });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'API key inválida o revocada' }, { status: 401 });
  }

  const { box_id, scopes } = data[0];

  // Rate limit: se necesita el id real de la key (verify_api_key solo
  // devuelve box_id/scopes), así que se busca aparte antes de contar.
  const { data: keyRow } = await supabaseAdmin
    .from('api_keys')
    .select('id')
    .eq('key_hash', await sha256(key))
    .single();

  if (keyRow) {
    const { data: allowed } = await supabaseAdmin.rpc('check_and_log_api_rate_limit', {
      target_key_id: keyRow.id,
    });
    if (allowed === false) {
      return NextResponse.json({ error: 'Rate limit excedido — intenta de nuevo en un minuto' }, { status: 429 });
    }
  }

  supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', await sha256(key))
    .then(() => {});

  return { boxId: box_id, scopes: scopes as string[] };
}

export function requireScope(ctx: ApiAuthContext, scope: 'read' | 'write'): NextResponse | null {
  if (!ctx.scopes.includes(scope)) {
    return NextResponse.json({ error: `Esta API key no tiene el alcance "${scope}"` }, { status: 403 });
  }
  return null;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
