import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateApiRequest, requireScope } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (auth instanceof NextResponse) return auth;

  const scopeError = requireScope(auth, 'read');
  if (scopeError) return scopeError;

  const { data, error } = await supabaseAdmin
    .from('box_members')
    .select('profile_id, role, status, joined_at, profiles(full_name, phone)')
    .eq('box_id', auth.boxId)
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
