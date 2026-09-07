'use client';

import { useState, useTransition } from 'react';
import { createService } from './actions';

export function NewServiceForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo servicio
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createService(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-md flex flex-col gap-3"
    >
      <input name="name" required placeholder="Ej. Halterofilia" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <input name="description" placeholder="Descripción (opcional)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}
