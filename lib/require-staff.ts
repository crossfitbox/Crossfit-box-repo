import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from './supabase-server';
import { supabaseAdmin } from './supabase-admin';

export interface StaffMembership {
  boxId: string;
  boxName: string;
  role: string; // coach | admin | owner | rol personalizado
}

export interface StaffSession {
  userId: string;
  fullName: string;
  boxId: string;
  boxName: string;
  role: string; // coach | admin | owner | rol personalizado
  /** Todos los boxes donde este usuario es staff — para el selector. */
  memberships: StaffMembership[];
}

const ACTIVE_BOX_COOKIE = 'active_box_id';

/**
 * Verifica que haya una sesión de Supabase Auth activa Y que ese
 * usuario tenga rol coach/admin/owner en al menos un box
 * (box_members). Si cualquiera de las dos condiciones falla, redirige
 * a /login.
 *
 * Multi-box: si el usuario es staff en varios boxes, el box "activo"
 * sale de la cookie `active_box_id` (la fija el selector, ver
 * components/box-switcher.tsx). Si la cookie no existe o apunta a un
 * box donde ya no tiene membresía, cae al primero que encuentre.
 */
export async function requireStaffSession(): Promise<StaffSession> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabaseAdmin
    .from('box_members')
    .select('box_id, role, profiles(full_name), boxes(name)')
    .eq('profile_id', user.id)
    .neq('role', 'athlete') // incluye coach/admin/owner y cualquier rol personalizado (custom_roles)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) {
    redirect('/login');
  }

  const allMemberships: StaffMembership[] = memberships.map((m: any) => ({
    boxId: m.box_id,
    boxName: m.boxes?.name ?? 'Box',
    role: m.role,
  }));

  const cookieStore = cookies();
  const activeBoxId = cookieStore.get(ACTIVE_BOX_COOKIE)?.value;

  const active =
    allMemberships.find((m) => m.boxId === activeBoxId) ?? allMemberships[0];

  const fullName =
    (memberships as any[]).find((m) => m.box_id === active.boxId)?.profiles
      ?.full_name ?? user.email ?? 'Staff';

  // Si el box exige MFA, el usuario debe tener al menos un factor
  // verificado antes de pasar — si no, se le manda a inscribirlo.
  const { data: box } = await supabaseAdmin
    .from('boxes')
    .select('require_mfa_for_staff')
    .eq('id', active.boxId)
    .maybeSingle();

  if (box?.require_mfa_for_staff) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = (factorsData?.totp ?? []).some((f) => f.status === 'verified');
    if (!hasVerifiedFactor) {
      redirect('/mfa-setup');
    }
  }

  return {
    userId: user.id,
    fullName,
    boxId: active.boxId,
    boxName: active.boxName,
    role: active.role,
    memberships: allMemberships,
  };
}
