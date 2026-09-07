import { supabaseAdmin } from '@/lib/supabase-admin';
import { requirePlatformAdmin } from '@/lib/require-platform-admin';
import { startSupportSession } from './actions';

export default async function SupportPage() {
  await requirePlatformAdmin();

  const [boxesRes, recentSessionsRes] = await Promise.all([
    supabaseAdmin.from('boxes').select('id, name, status').order('name'),
    supabaseAdmin
      .from('support_sessions')
      .select('id, target_box_id, reason, started_at, ended_at, boxes(name)')
      .order('started_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="min-h-screen bg-bg p-10">
      <h1 className="font-display text-2xl text-primary mb-1">Soporte de plataforma</h1>
      <p className="text-secondary text-sm mb-8">
        Entrar a la cuenta de un cliente queda auditado y visible para su owner
      </p>

      <form action={startSupportSession} className="max-w-md flex flex-col gap-3 border border-border rounded p-4 mb-10">
        <select name="box_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
          {(boxesRes.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input name="reason" required placeholder="Motivo (obligatorio, ej. 'Ticket #482 — no llegan notificaciones')" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <button type="submit" className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start">
          Entrar como soporte
        </button>
      </form>

      <h2 className="font-display text-sm text-primary mb-3">Sesiones de soporte recientes</h2>
      <table className="data-table max-w-3xl">
        <thead>
          <tr><th>Box</th><th>Motivo</th><th>Inicio</th><th>Fin</th></tr>
        </thead>
        <tbody>
          {(recentSessionsRes.data ?? []).map((s: any) => (
            <tr key={s.id}>
              <td>{s.boxes?.name}</td>
              <td className="text-secondary">{s.reason}</td>
              <td className="text-secondary">{new Date(s.started_at).toLocaleString('es-CO')}</td>
              <td className="text-secondary">{s.ended_at ? new Date(s.ended_at).toLocaleString('es-CO') : 'En curso'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
