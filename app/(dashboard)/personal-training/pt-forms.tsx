'use client';

import { useState, useTransition } from 'react';
import { createPtPackage, scheduleSession, completeSession } from './actions';

interface MemberOption { profileId: string; name: string }

export function NewPackageForm({ members, coaches }: { members: MemberOption[]; coaches: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo paquete
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createPtPackage(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <select name="profile_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
      </select>
      <select name="coach_id" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="">Sin coach fijo</option>
        {coaches.map((c) => <option key={c.profileId} value={c.profileId}>{c.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input name="total_sessions" type="number" min={1} required placeholder="N° sesiones" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <input name="expires_at" type="date" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function ScheduleSessionForm({ packageId }: { packageId: string }) {
  const [pending, startTransition] = useTransition();
  const action = scheduleSession.bind(null, packageId);

  return (
    <form action={(fd) => startTransition(() => action(fd))} className="flex items-center gap-2">
      <input name="scheduled_at" type="datetime-local" required className="bg-surface border border-border rounded px-2 py-1 text-xs text-primary" />
      <button type="submit" disabled={pending} className="text-xs text-accent hover:opacity-80">Agendar</button>
    </form>
  );
}

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => completeSession(sessionId))}
      disabled={pending}
      className="text-xs text-success hover:opacity-80"
    >
      {pending ? '...' : 'Marcar completada'}
    </button>
  );
}
