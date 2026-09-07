'use client';

import { useTransition } from 'react';
import { freezeMembership } from '../../actions';

export function FreezeForm({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();
  const action = freezeMembership.bind(null, profileId);

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="max-w-sm flex flex-col gap-3 border border-border rounded p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-secondary mb-1">Desde</label>
          <input type="date" name="starts_on" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Hasta</label>
          <input type="date" name="ends_on" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        </div>
      </div>
      <input name="reason" placeholder="Motivo (opcional)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start disabled:opacity-50"
      >
        {pending ? 'Guardando...' : 'Congelar membresía'}
      </button>
      <p className="text-xs text-secondary">
        Si el box tiene configurado extender el vencimiento, la suscripción
        activa se alarga automáticamente por los mismos días del congelamiento.
      </p>
    </form>
  );
}
