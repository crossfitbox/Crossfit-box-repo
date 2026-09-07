'use client';

import { useState, useTransition } from 'react';
import { createCustomRole } from './actions';

export function NewCustomRoleForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-accent hover:opacity-80">
        + Nuevo rol personalizado
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createCustomRole(fd); setOpen(false); })}
      className="flex items-center gap-2"
    >
      <input name="label" required placeholder="Ej. Recepción" className="bg-surface border border-border rounded px-3 py-1.5 text-sm text-primary" />
      <button type="submit" disabled={pending} className="text-sm text-accent hover:opacity-80">
        {pending ? 'Creando...' : 'Crear'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-secondary hover:text-primary">Cancelar</button>
    </form>
  );
}
