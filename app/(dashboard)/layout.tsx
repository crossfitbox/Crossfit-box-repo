import { cookies } from 'next/headers';
import { Sidebar } from '@/components/sidebar';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffSession();
  const permissions = await getPermissions(session);
  const inSupportMode = Boolean(cookies().get('support_session_id')?.value);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        permissions={permissions}
        isOwner={session.role === 'owner'}
        boxId={session.boxId}
        memberships={session.memberships}
      />
      <div className="flex-1 flex flex-col">
        {inSupportMode && (
          <div className="bg-warning/15 text-warning text-sm px-10 py-2 flex items-center justify-between">
            <span>⚠ Sesión de soporte activa — estás viendo este box como staff de la plataforma</span>
            <a href="/soporte" className="underline">Ir a soporte</a>
          </div>
        )}
        <header className="flex items-center justify-end gap-5 px-10 py-4 border-b border-border">
          <ThemeToggle />
          <span className="text-sm text-secondary">
            {session.fullName} · <span className="capitalize">{session.role}</span>
          </span>
          <LogoutButton />
        </header>
        <main className="flex-1 px-10 py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
