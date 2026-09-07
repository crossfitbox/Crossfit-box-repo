'use client';

import { useState, useTransition } from 'react';
import { adjustCredits } from './actions';

interface MemberOption {
  profileId: string;
  name: string;
}

export function AdjustCreditsForm({ members }: { members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Ajustar créditos
        </button>
      ) : (
        <form
          action={(formData) => {
            startTransition(async () => {
              await adjustCredits(formData);
              setOpen(false);
            });
          }}
          className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
        >
          <div>
            <label className="block text-sm text-secondary mb-1">Atleta</label>
            <select
              name="profile_id"
              required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
            >
              {members.map((m) => (
                <option key={m.profileId} value={m.profileId}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">
              Cantidad (positivo agrega, negativo descuenta)
            </label>
            <input
              type="number"
              name="delta"
              required
              placeholder="Ej. 4 o -2"
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">
              Motivo (obligatorio, queda en auditoría)
            </label>
            <input
              type="text"
              name="reason"
              required
              placeholder="Ej. Compensación por clase cancelada por el box"
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? 'Guardando...' : 'Confirmar ajuste'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-secondary text-sm px-4 py-2 hover:text-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
