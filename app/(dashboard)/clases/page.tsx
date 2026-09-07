import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { deleteClass } from './actions';

async function getClasses(boxId: string) {
  const { data } = await supabaseAdmin
    .from('classes')
    .select(
      'id, starts_at, ends_at, capacity, class_types(name), coach:profiles(full_name), locations(name), bookings(id, status)',
    )
    .eq('box_id', boxId)
    .order('starts_at', { ascending: true })
    .limit(50);

  return data ?? [];
}

export default async function ClassesPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const classes = await getClasses(session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Clases</h1>
          <p className="text-secondary text-sm">
            Próximas clases programadas y ocupación de cupos
          </p>
        </div>
        {perms.classes.create && (
          <Link
            href="/clases/nueva"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Nueva clase
          </Link>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Horario</th>
            <th>Sede</th>
            <th>Tipo</th>
            <th>Coach</th>
            <th>Cupos</th>
            {(perms.classes.edit || perms.classes.delete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {classes.map((c: any) => {
            const active = (c.bookings ?? []).filter(
              (b: any) => b.status !== 'cancelled',
            ).length;
            const full = active >= c.capacity;

            return (
              <tr key={c.id}>
                <td>
                  {new Date(c.starts_at).toLocaleString('es-CO', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="text-secondary">{c.locations?.name ?? '—'}</td>
                <td>{c.class_types?.name ?? '—'}</td>
                <td>{c.coach?.full_name ?? '—'}</td>
                <td>
                  <span className={`pill ${full ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                    {active}/{c.capacity}
                  </span>
                </td>
                {(perms.classes.edit || perms.classes.delete) && (
                  <td>
                    <div className="flex gap-3 justify-end">
                      {perms.classes.edit && (
                        <Link
                          href={`/clases/${c.id}/editar`}
                          className="text-xs text-secondary hover:text-primary"
                        >
                          Editar
                        </Link>
                      )}
                      {perms.classes.delete && (
                        <form action={deleteClass.bind(null, c.id)}>
                          <button type="submit" className="text-xs text-accent hover:opacity-80">
                            Borrar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {classes.length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                No hay clases programadas todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
