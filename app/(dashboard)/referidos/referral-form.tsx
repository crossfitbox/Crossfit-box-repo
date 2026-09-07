'use client';

import { useState, useTransition } from 'react';
import { createReferral } from './actions';

interface MemberOption { profileId: string; name: string }

export function NewReferralForm({ members }: { members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Registrar referido
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createReferral(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <div>
        <label className="block text-sm text-secondary mb-1">Quién refirió</label>
        <select name="referrer_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
          {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-secondary mb-1">Atleta referido (nuevo)</label>
        <select name="referred_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
          {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-secondary mb-1">
          Créditos de recompensa (se entregan solo cuando el referido pague por primera vez)
        </label>
        <input name="reward_credits" type="number" min={0} defaultValue={4} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Registrar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}
