'use client';

import { useState, useTransition } from 'react';
import { createKioskToken, revokeKioskToken } from './actions';

interface LocationOption { id: string; name: string }

export function NewKioskTokenForm({ locations }: { locations: LocationOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo dispositivo
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createKioskToken(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-sm flex flex-col gap-3"
    >
      <input name="label" required placeholder="Ej. Tablet recepción" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <select name="location_id" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="">Sin sede específica</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Creando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function RevokeKioskButton({ tokenId }: { tokenId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button onClick={() => startTransition(() => revokeKioskToken(tokenId))} disabled={pending} className="text-xs text-accent hover:opacity-80">
      Revocar
    </button>
  );
}
