import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { advanceStage, markLost, deleteLead } from './actions';
import { STAGES } from './constants';

const STAGE_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  trial_scheduled: 'Clase de prueba agendada',
  trial_completed: 'Clase de prueba hecha',
  converted: 'Convertido',
  lost: 'Perdido',
};

const SOURCE_LABELS: Record<string, string> = {
  walk_in: 'Visita directa',
  instagram: 'Instagram',
  referral: 'Referido',
  website: 'Sitio web',
  other: 'Otro',
};

async function getLeads(boxId: string) {
  const { data } = await supabaseAdmin
    .from('leads')
    .select('id, full_name, phone, source, stage, notes, created_at')
    .eq('box_id', boxId)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export default async function LeadsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const leads = await getLeads(session.boxId);

  const columns = [...STAGES] as string[];
  const lostCount = leads.filter((l) => l.stage === 'lost').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Prospectos</h1>
          <p className="text-secondary text-sm">
            Pipeline de gente interesada, desde el primer contacto hasta inscribirse
            {lostCount > 0 && ` · ${lostCount} perdidos`}
          </p>
        </div>
        {perms.leads.create && (
          <Link
            href="/prospectos/nuevo"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Nuevo prospecto
          </Link>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {columns.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium text-secondary uppercase tracking-wide">
                  {STAGE_LABELS[stage]}
                </h2>
                <span className="text-xs text-secondary">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-surface border border-border rounded p-3"
                  >
                    <div className="text-sm text-primary">{lead.full_name}</div>
                    {lead.phone && (
                      <div className="text-xs text-secondary mt-0.5">{lead.phone}</div>
                    )}
                    <div className="text-xs text-secondary mt-1">
                      {SOURCE_LABELS[lead.source ?? 'other']}
                    </div>
                    {lead.notes && (
                      <div className="text-xs text-secondary mt-2 line-clamp-2">
                        {lead.notes}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {perms.leads.edit && stage !== 'converted' && (
                        <form action={advanceStage.bind(null, lead.id, stage as any)}>
                          <button
                            type="submit"
                            className="text-xs text-accent hover:opacity-80"
                          >
                            Avanzar →
                          </button>
                        </form>
                      )}
                      {perms.leads.edit && stage !== 'converted' && stage !== 'lost' && (
                        <form action={markLost.bind(null, lead.id)}>
                          <button
                            type="submit"
                            className="text-xs text-secondary hover:opacity-80"
                          >
                            Marcar perdido
                          </button>
                        </form>
                      )}
                      {perms.leads.delete && (
                        <form action={deleteLead.bind(null, lead.id)}>
                          <button
                            type="submit"
                            className="text-xs text-secondary hover:opacity-80"
                          >
                            Borrar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-secondary py-6 text-center border border-dashed border-border rounded">
                    Vacío
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
