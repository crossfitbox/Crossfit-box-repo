'use client';

import { useState, useTransition } from 'react';
import { createReceivable, applyPayment } from './actions';

interface MemberOption {
  profileId: string;
  name: string;
}
interface ReceivableOption {
  id: string;
  label: string;
}

export function NewReceivableForm({ members }: { members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
      >
        Nueva cuenta por cobrar
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createReceivable(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <select name="profile_id" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        {members.map((m) => (
          <option key={m.profileId} value={m.profileId}>{m.name}</option>
        ))}
      </select>
      <input name="description" required placeholder="Descripción (ej. saldo de matrícula)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="grid grid-cols-2 gap-3">
        <input name="amount" type="number" step="0.01" min={0} required placeholder="Monto" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <input name="due_date" type="date" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
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

export function ApplyPaymentForm({ receivable }: { receivable: ReceivableOption }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-accent hover:opacity-80">
        Registrar abono
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await applyPayment(fd); setOpen(false); })}
      className="flex items-center gap-2 mt-1"
    >
      <input type="hidden" name="receivable_id" value={receivable.id} />
      <input name="amount" type="number" step="0.01" min={0} required placeholder="Monto" className="w-24 bg-surface border border-border rounded px-2 py-1 text-xs text-primary" />
      <select name="method" className="bg-surface border border-border rounded px-2 py-1 text-xs text-primary">
        <option value="cash">Efectivo</option>
        <option value="card">Tarjeta</option>
        <option value="transfer">Transferencia</option>
      </select>
      <button type="submit" disabled={pending} className="text-xs text-accent hover:opacity-80">
        {pending ? '...' : 'Aplicar'}
      </button>
    </form>
  );
}
