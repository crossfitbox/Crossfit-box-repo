'use client';

import { useState, useTransition } from 'react';
import { createClassType } from './actions';

interface ServiceOption { id: string; name: string }

export function NewClassTypeForm({ services }: { services: ServiceOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo tipo de clase
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createClassType(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-md flex flex-col gap-3"
    >
      <input name="name" required placeholder="Ej. WOD, Open Box, Halterofilia" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <select name="service_id" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="">Sin servicio asociado</option>
        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input type="checkbox" name="is_open_box" className="accent-accent" />
        Es Open Box (entrenamiento libre, no clase dirigida)
      </label>
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input type="checkbox" name="requires_supervision" defaultChecked className="accent-accent" />
        Requiere supervisión de un coach
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}
