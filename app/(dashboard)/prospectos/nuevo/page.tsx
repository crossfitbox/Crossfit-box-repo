import { redirect } from 'next/navigation';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';
import { createLead } from '../actions';

export default async function NewLeadPage() {
  const session = await requireStaffSession();
  if (!(await can(session, 'leads', 'create'))) {
    redirect('/prospectos');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium mb-6">Nuevo prospecto</h1>
      <form action={createLead} className="max-w-md flex flex-col gap-4">
        <div>
          <label className="block text-sm text-secondary mb-1">Nombre completo</label>
          <input
            type="text"
            name="full_name"
            required
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Correo</label>
          <input
            type="email"
            name="email"
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">¿Cómo llegó?</label>
          <select
            name="source"
            defaultValue="walk_in"
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          >
            <option value="walk_in">Visita directa</option>
            <option value="instagram">Instagram</option>
            <option value="referral">Referido</option>
            <option value="website">Sitio web</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-secondary mb-1">Notas</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          />
        </div>

        <button
          type="submit"
          className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start"
        >
          Crear prospecto
        </button>
      </form>
    </div>
  );
}
