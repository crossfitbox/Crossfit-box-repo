import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { PermissionsMatrixForm } from './permissions-matrix-form';
import { NewCustomRoleForm } from './custom-role-form';

const RESOURCES = [
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
const FIXED_ROLES = ['coach', 'admin'];

export default async function RolesPage() {
  const session = await requireStaffSession();

  if (session.role !== 'owner') {
    redirect('/');
  }

  const { data: customRoles } = await supabaseAdmin
    .from('custom_roles')
    .select('name, label')
    .eq('box_id', session.boxId);

  const allRoles = [...FIXED_ROLES, ...(customRoles ?? []).map((r) => r.name)];

  const { data: existing } = await supabaseAdmin
    .from('role_permissions')
    .select('role, resource, can_view, can_create, can_edit, can_delete')
    .eq('box_id', session.boxId);

  const rows = [];
  for (const role of allRoles) {
    for (const resource of RESOURCES) {
      const found = (existing ?? []).find(
        (r) => r.role === role && r.resource === resource,
      );
      rows.push(
        found ?? {
          role,
          resource,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
      );
    }
  }

  const roleLabels: Record<string, string> = { coach: 'Coach', admin: 'Admin' };
  for (const r of customRoles ?? []) roleLabels[r.name] = r.label;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">Roles y permisos</h1>
        <p className="text-secondary text-sm">
          Qué puede hacer cada rol dentro del panel. El owner siempre tiene acceso
          total y no aparece aquí.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-sm font-medium mb-3">Roles personalizados</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {(customRoles ?? []).map((r) => (
            <span key={r.name} className="pill bg-surface text-secondary border border-border">{r.label}</span>
          ))}
        </div>
        <NewCustomRoleForm />
      </div>

      <PermissionsMatrixForm initialRows={rows} roles={allRoles} roleLabels={roleLabels} />
    </div>
  );
}
