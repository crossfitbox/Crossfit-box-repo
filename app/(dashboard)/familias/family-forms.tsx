'use client';

import { useState, useTransition } from 'react';
import { createFamilyGroup, addFamilyMember } from './actions';

interface MemberOption { profileId: string; name: string }

export function NewFamilyGroupForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo grupo familiar
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createFamilyGroup(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-sm flex flex-col gap-3"
    >
      <input name="name" required placeholder="Ej. Familia Gómez" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function AddFamilyMemberForm({ groupId, members }: { groupId: string; members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const action = addFamilyMember.bind(null, groupId);

  return (
    <form action={(fd) => startTransition(() => action(fd))} className="flex items-center gap-2 mt-2">
      <select name="profile_id" required className="bg-surface border border-border rounded px-2 py-1 text-xs text-primary">
        {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
      </select>
      <button type="submit" disabled={pending} className="text-xs text-accent hover:opacity-80">
        Agregar al grupo
      </button>
    </form>
  );
}
