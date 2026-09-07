'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';

export async function createSsoDomain(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede configurar SSO');
  }

  await supabaseAdmin.from('sso_domains').insert({
    box_id: session.boxId,
    email_domain: (formData.get('email_domain') as string)?.trim().toLowerCase(),
    sso_provider_id: formData.get('sso_provider_id'),
    provider_name: formData.get('provider_name') || 'SSO corporativo',
    enforce: formData.get('enforce') === 'on',
  });

  revalidatePath('/sso');
}

export async function toggleRequireMfa(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede cambiar la política de MFA');
  }

  await supabaseAdmin
    .from('boxes')
    .update({ require_mfa_for_staff: formData.get('require_mfa') === 'on' })
    .eq('id', session.boxId);

  revalidatePath('/sso');
}

export async function updateIpAllowlist(formData: FormData) {
  const session = await requireStaffSession();
  if (session.role !== 'owner') {
    throw new Error('Solo el owner puede cambiar la lista de IPs permitidas');
  }

  const raw = (formData.get('ranges') as string) ?? '';
  const ranges = raw
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  await supabaseAdmin
    .from('boxes')
    .update({ allowed_ip_ranges: ranges.length > 0 ? ranges : null })
    .eq('id', session.boxId);

  revalidatePath('/sso');
}
