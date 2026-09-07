'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PermissionMatrix } from '@/lib/permissions';
import type { StaffMembership } from '@/lib/require-staff';
import { BoxSwitcher } from './box-switcher';

interface NavItem {
  href: string;
  label: string;
  resource?: keyof PermissionMatrix; // si no tiene, siempre visible para staff
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Resumen' },
  { href: '/guia', label: 'Guía de inicio' },
  { href: '/clases', label: 'Clases', resource: 'classes' },
  { href: '/wods', label: 'WODs', resource: 'wods' },
  { href: '/sedes', label: 'Sedes', resource: 'locations' },
  { href: '/tipos-clase', label: 'Tipos de clase', resource: 'classes' },
  { href: '/miembros', label: 'Miembros', resource: 'members' },
  { href: '/familias', label: 'Familias', resource: 'members' },
  { href: '/referidos', label: 'Referidos', resource: 'members' },
  { href: '/planes', label: 'Planes y pagos', resource: 'plans' },
  { href: '/descuentos', label: 'Descuentos', resource: 'settings' },
  { href: '/personal-training', label: 'Personal Training', resource: 'settings' },
  { href: '/finanzas', label: 'Finanzas', resource: 'finance' },
  { href: '/kpis', label: 'KPIs', resource: 'finance' },
  { href: '/creditos', label: 'Créditos', resource: 'credits' },
  { href: '/cobros', label: 'Cuentas por cobrar', resource: 'finance' },
  { href: '/servicios', label: 'Servicios', resource: 'settings' },
  { href: '/productos', label: 'Productos', resource: 'settings' },
  { href: '/documentos', label: 'Documentos', resource: 'settings' },
  { href: '/cumplimiento', label: 'Cumplimiento', resource: 'settings' },
  { href: '/kiosco', label: 'Modo kiosco', resource: 'settings' },
  { href: '/retencion', label: 'Retención' },
  { href: '/prospectos', label: 'Prospectos', resource: 'leads' },
  { href: '/auditoria', label: 'Auditoría', resource: 'audit' },
];

export function Sidebar({
  permissions,
  isOwner,
  boxId,
  memberships,
}: {
  permissions: PermissionMatrix;
  isOwner: boolean;
  boxId: string;
  memberships: StaffMembership[];
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.resource || permissions[item.resource].view,
  );

  return (
    <aside className="w-60 border-r border-border px-6 py-8 shrink-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0">
          <div className="w-4 h-2.5 bg-primary rounded-sm" />
        </div>
        <BoxSwitcher currentBoxId={boxId} memberships={memberships} />
      </div>

      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? 'bg-surface text-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {isOwner && (
          <>
            <div className="h-px bg-border my-3" />
            <Link
              href="/marca"
              className={`px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith('/marca') ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              Marca
            </Link>
            <Link
              href="/desarrolladores"
              className={`px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith('/desarrolladores') ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              Desarrolladores
            </Link>
            <Link
              href="/sso"
              className={`px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith('/sso') ? 'bg-surface text-primary' : 'text-secondary hover:text-primary'
              }`}
            >
              SSO y seguridad
            </Link>
            <Link
              href="/roles"
              className={`px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith('/roles')
                  ? 'bg-surface text-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Roles y permisos
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
