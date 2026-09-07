import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { deleteLocation } from './actions';

async function getLocations(boxId: string) {
  const { data } = await supabaseAdmin
    .from('locations')
    .select('id, name, address, phone, is_primary, classes(id)')
    .eq('box_id', boxId)
    .order('is_primary', { ascending: false });

  return data ?? [];
}

export default async function LocationsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const locations = await getLocations(session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Sedes</h1>
          <p className="text-secondary text-sm">
            {session.boxName} — {locations.length}{' '}
            {locations.length === 1 ? 'sede' : 'sedes'}
          </p>
        </div>
        {perms.locations.create && (
          <Link
            href="/sedes/nueva"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Nueva sede
          </Link>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Clases</th>
            <th></th>
            {(perms.locations.edit || perms.locations.delete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {locations.map((l: any) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td className="text-secondary">{l.address ?? '—'}</td>
              <td className="text-secondary">{l.phone ?? '—'}</td>
              <td className="text-secondary">{(l.classes ?? []).length}</td>
              <td>
                {l.is_primary && (
                  <span className="pill bg-success/15 text-success">Principal</span>
                )}
              </td>
              {(perms.locations.edit || perms.locations.delete) && (
                <td>
                  <div className="flex gap-3 justify-end">
                    {perms.locations.edit && (
                      <Link
                        href={`/sedes/${l.id}/editar`}
                        className="text-xs text-secondary hover:text-primary"
                      >
                        Editar
                      </Link>
                    )}
                    {perms.locations.delete && (
                      <form action={deleteLocation.bind(null, l.id)}>
                        <button type="submit" className="text-xs text-accent hover:opacity-80">
                          Borrar
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {locations.length === 0 && (
            <tr>
              <td colSpan={6} className="text-secondary text-center py-10">
                No hay sedes registradas todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
