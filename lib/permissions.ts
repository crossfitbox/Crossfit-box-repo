import { supabaseAdmin } from './supabase-admin';
import type { StaffSession } from './require-staff';

export type Resource =
  | 'classes'
  | 'wods'
  | 'members'
  | 'plans'
  | 'expenses'
  | 'leads'
  | 'finance'
  | 'settings'
  | 'locations'
  | 'credits'
  | 'audit';

export type Action = 'view' | 'create' | 'edit' | 'delete';

export type PermissionMatrix = Record<Resource, Record<Action, boolean>>;

const RESOURCES: Resource[] = [
  'classes',
  'wods',
  'members',
  'plans',
  'expenses',
  'leads',
  'finance',
  'settings',
  'locations',
  'credits',
  'audit',
];
const ACTIONS: Action[] = ['view', 'create', 'edit', 'delete'];

/**
 * Trae la matriz de permisos efectiva para el rol de la sesión actual.
 * El owner tiene acceso total sin consultar la tabla (igual que la
 * función auth_user_can() del lado de Postgres). Para coach/admin, se
 * lee role_permissions y cualquier combinación resource/action que no
 * tenga fila explícita se trata como denegada.
 */
export async function getPermissions(
  session: StaffSession,
): Promise<PermissionMatrix> {
  const allTrue = Object.fromEntries(
    RESOURCES.map((r) => [
      r,
      Object.fromEntries(ACTIONS.map((a) => [a, true])) as Record<Action, boolean>,
    ]),
  ) as PermissionMatrix;

  if (session.role === 'owner') return allTrue;

  const allFalse = Object.fromEntries(
    RESOURCES.map((r) => [
      r,
      Object.fromEntries(ACTIONS.map((a) => [a, false])) as Record<Action, boolean>,
    ]),
  ) as PermissionMatrix;

  const { data } = await supabaseAdmin
    .from('role_permissions')
    .select('resource, can_view, can_create, can_edit, can_delete')
    .eq('box_id', session.boxId)
    .eq('role', session.role);

  for (const row of data ?? []) {
    const r = row.resource as Resource;
    if (!allFalse[r]) continue;
    allFalse[r] = {
      view: row.can_view,
      create: row.can_create,
      edit: row.can_edit,
      delete: row.can_delete,
    };
  }

  return allFalse;
}

/**
 * Verificación puntual para usar dentro de un Server Action, ANTES de
 * escribir en la base de datos. Nunca confíes solo en ocultar el
 * botón en la UI — el chequeo real vive aquí y en `auth_user_can()`
 * si en el futuro se decide mover la escritura a un cliente con RLS
 * en vez del service role.
 */
export async function can(
  session: StaffSession,
  resource: Resource,
  action: Action,
): Promise<boolean> {
  if (session.role === 'owner') return true;

  const { data } = await supabaseAdmin
    .from('role_permissions')
    .select('can_view, can_create, can_edit, can_delete')
    .eq('box_id', session.boxId)
    .eq('role', session.role)
    .eq('resource', resource)
    .maybeSingle();

  if (!data) return false;

  return {
    view: data.can_view,
    create: data.can_create,
    edit: data.can_edit,
    delete: data.can_delete,
  }[action];
}
