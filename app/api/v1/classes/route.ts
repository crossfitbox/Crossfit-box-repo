import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateApiRequest, requireScope } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'read');
  if (scopeError) return scopeError;

  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('id, starts_at, ends_at, capacity, class_types(name), locations(name)')
    .eq('box_id', auth.boxId)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
