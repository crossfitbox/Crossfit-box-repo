import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { removeMember } from './actions';

async function getMembers(boxId: string) {
  const { data } = await supabaseAdmin
    .from('box_members')
    .select('id, role, status, joined_at, profiles(full_name, phone)')
    .eq('box_id', boxId)
    .order('joined_at', { ascending: false })
    .limit(100);

  return data ?? [];
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success/15 text-success',
  frozen: 'bg-warning/15 text-warning',
  cancelled: 'bg-secondary/15 text-secondary',
};

export default async function MembersPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const members = await getMembers(session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Miembros</h1>
          <p className="text-secondary text-sm">Atletas, coaches y staff del box</p>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Desde</th>
            {(perms.members.edit || perms.members.delete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m: any) => (
            <tr key={m.id}>
              <td>{m.profiles?.full_name ?? '—'}</td>
              <td className="text-secondary">{m.profiles?.phone ?? '—'}</td>
              <td className="capitalize">{m.role}</td>
              <td>
                <span className={`pill ${STATUS_STYLES[m.status] ?? ''}`}>
                  {m.status}
                </span>
              </td>
              <td className="text-secondary">
                {new Date(m.joined_at).toLocaleDateString('es-CO')}
              </td>
              {(perms.members.edit || perms.members.delete) && (
                <td>
                  <div className="flex gap-3 justify-end">
                    {perms.members.edit && (
                      <Link
                        href={`/miembros/${m.id}/editar`}
                        className="text-xs text-secondary hover:text-primary"
                      >
                        Editar
                      </Link>
                    )}
                    {perms.members.delete && (
                      <form action={removeMember.bind(null, m.id)}>
                        <button type="submit" className="text-xs text-accent hover:opacity-80">
                          Quitar
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={6} className="text-secondary text-center py-10">
                No hay miembros registrados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
