import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { deleteWod } from './actions';

async function getWods(boxId: string) {
  const { data } = await supabaseAdmin
    .from('wods')
    .select('id, date, title, description, score_type, wod_results(id)')
    .eq('box_id', boxId)
    .order('date', { ascending: false })
    .limit(30);

  return data ?? [];
}

export default async function WodsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const wods = await getWods(session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">WODs</h1>
          <p className="text-secondary text-sm">
            Entrenamientos publicados y participación por día
          </p>
        </div>
        {perms.wods.create && (
          <Link
            href="/wods/nueva"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Publicar WOD
          </Link>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Título</th>
            <th>Tipo de score</th>
            <th>Resultados registrados</th>
            {(perms.wods.edit || perms.wods.delete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {wods.map((w: any) => (
            <tr key={w.id}>
              <td>
                {new Date(w.date).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td>{w.title ?? 'Sin título'}</td>
              <td className="text-secondary">{w.score_type}</td>
              <td>{(w.wod_results ?? []).length}</td>
              {(perms.wods.edit || perms.wods.delete) && (
                <td>
                  <div className="flex gap-3 justify-end">
                    {perms.wods.edit && (
                      <Link
                        href={`/wods/${w.id}/editar`}
                        className="text-xs text-secondary hover:text-primary"
                      >
                        Editar
                      </Link>
                    )}
                    {perms.wods.delete && (
                      <form action={deleteWod.bind(null, w.id)}>
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
          {wods.length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                No hay WODs publicados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
