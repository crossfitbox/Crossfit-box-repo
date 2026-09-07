import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewClassTypeForm } from './class-type-form';

export default async function ClassTypesPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [classTypesRes, servicesRes] = await Promise.all([
    supabaseAdmin
      .from('class_types')
      .select('id, name, is_open_box, requires_supervision, services(name)')
      .eq('box_id', session.boxId)
      .order('name'),
    supabaseAdmin.from('services').select('id, name').eq('box_id', session.boxId),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Tipos de clase</h1>
          <p className="text-secondary text-sm">
            WOD, Halterofilia, Open Box... cada uno se asocia a un servicio y
            define si requiere supervisión de un coach
          </p>
        </div>
        {perms.classes.create && <NewClassTypeForm services={servicesRes.data ?? []} />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Servicio</th>
            <th>Open Box</th>
            <th>Requiere supervisión</th>
          </tr>
        </thead>
        <tbody>
          {(classTypesRes.data ?? []).map((ct: any) => (
            <tr key={ct.id}>
              <td>{ct.name}</td>
              <td className="text-secondary">{ct.services?.name ?? '—'}</td>
              <td className="text-secondary">{ct.is_open_box ? 'Sí' : 'No'}</td>
              <td className="text-secondary">{ct.requires_supervision ? 'Sí' : 'No'}</td>
            </tr>
          ))}
          {(classTypesRes.data ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="text-secondary text-center py-10">
                Sin tipos de clase creados — el formulario de clases no tendrá opciones hasta que crees al menos uno
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
