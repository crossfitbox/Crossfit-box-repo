import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewServiceForm } from './service-form';

export default async function ServicesPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const { data: services } = await supabaseAdmin
    .from('services')
    .select('id, name, description, active, class_types(id)')
    .eq('box_id', session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Servicios</h1>
          <p className="text-secondary text-sm">
            Disciplinas que ofrece el box — CrossFit, Halterofilia, Open Box...
            cada plan de membresía elige cuáles incluye
          </p>
        </div>
        {perms.settings.edit && <NewServiceForm />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Servicio</th>
            <th>Descripción</th>
            <th>Tipos de clase asociados</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {(services ?? []).map((s: any) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td className="text-secondary">{s.description ?? '—'}</td>
              <td className="text-secondary">{(s.class_types ?? []).length}</td>
              <td>
                <span className={`pill ${s.active ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'}`}>
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>
          ))}
          {(services ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="text-secondary text-center py-10">
                Sin servicios definidos — por defecto todo se trata como un único servicio
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
