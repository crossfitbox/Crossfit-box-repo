'use client';

import { useState, useTransition } from 'react';
import { createGdprRequest, processGdprRequest } from './actions';

interface MemberOption { profileId: string; name: string }

export function NewGdprRequestForm({ members }: { members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nueva solicitud
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createGdprRequest(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-md flex flex-col gap-3"
    >
      <select name="profile_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
      </select>
      <select name="request_type" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="export">Exportar mis datos</option>
        <option value="delete">Eliminar mis datos (derecho al olvido)</option>
      </select>
      <input name="notes" placeholder="Notas (opcional)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Registrar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function ProcessGdprButton({ requestId, profileId, type }: { requestId: string; profileId: string; type: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => processGdprRequest(requestId, profileId, type))}
      disabled={pending}
      className="text-xs text-accent hover:opacity-80"
    >
      {pending ? 'Procesando...' : type === 'delete' ? 'Anonimizar ahora' : 'Marcar exportado'}
    </button>
  );
}
