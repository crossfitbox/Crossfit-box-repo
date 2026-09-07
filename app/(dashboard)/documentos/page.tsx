import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewDocumentForm } from './document-form';

const TYPE_LABELS: Record<string, string> = {
  waiver: 'Exoneración de responsabilidad',
  reglamento: 'Reglamento',
  consentimiento: 'Consentimiento',
  privacidad: 'Política de privacidad',
};

export default async function DocumentsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [templatesRes, membersCountRes] = await Promise.all([
    supabaseAdmin
      .from('document_templates')
      .select('id, type, title, version, required, active, document_acceptances(id)')
      .eq('box_id', session.boxId)
      .order('type')
      .order('version', { ascending: false }),
    supabaseAdmin
      .from('box_members')
      .select('id', { count: 'exact', head: true })
      .eq('box_id', session.boxId)
      .eq('status', 'active'),
  ]);

  const totalMembers = membersCountRes.count ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Documentos y waivers</h1>
          <p className="text-secondary text-sm">
            Versionados — cada nueva versión requiere nueva aceptación si es obligatoria
          </p>
        </div>
        {perms.settings.edit && <NewDocumentForm />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Título</th>
            <th>Versión</th>
            <th>Obligatorio</th>
            <th>Aceptaciones</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {(templatesRes.data ?? []).map((d: any) => {
            const accepted = (d.document_acceptances ?? []).length;
            return (
              <tr key={d.id}>
                <td>{TYPE_LABELS[d.type] ?? d.type}</td>
                <td className="text-secondary">{d.title}</td>
                <td className="text-secondary">v{d.version}</td>
                <td>{d.required ? 'Sí' : 'No'}</td>
                <td className="text-secondary">
                  {accepted}/{totalMembers}
                </td>
                <td>
                  <span className={`pill ${d.active ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'}`}>
                    {d.active ? 'Vigente' : 'Reemplazada'}
                  </span>
                </td>
              </tr>
            );
          })}
          {(templatesRes.data ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="text-secondary text-center py-10">
                Sin documentos publicados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
