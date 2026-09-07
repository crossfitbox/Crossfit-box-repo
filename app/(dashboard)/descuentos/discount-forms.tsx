'use client';

import { useState, useTransition } from 'react';
import { createDiscount, redeemDiscount } from './actions';

interface PlanOption { id: string; name: string }
interface MemberOption { profileId: string; name: string }

export function NewDiscountForm({ plans }: { plans: PlanOption[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo descuento
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createDiscount(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <input name="code" placeholder="Código (opcional — vacío = descuento manual)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="grid grid-cols-2 gap-3">
        <select name="type" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
          <option value="percentage">Porcentaje</option>
          <option value="fixed">Monto fijo</option>
        </select>
        <input name="value" type="number" step="0.01" required placeholder="Valor" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      </div>
      <select name="plan_id" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="">Aplica a cualquier plan</option>
        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input name="valid_from" type="date" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <input name="valid_until" type="date" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      </div>
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input type="checkbox" name="stackable" className="accent-accent" />
        Acumulable con otros descuentos
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Guardando...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function RedeemDiscountForm({ discountId, members }: { discountId: string; members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form action={(fd) => startTransition(() => redeemDiscount(fd))} className="flex items-center gap-2">
      <input type="hidden" name="discount_id" value={discountId} />
      <select name="profile_id" required className="bg-surface border border-border rounded px-2 py-1 text-xs text-primary">
        {members.map((m) => <option key={m.profileId} value={m.profileId}>{m.name}</option>)}
      </select>
      <button type="submit" disabled={pending} className="text-xs text-accent hover:opacity-80">
        Aplicar
      </button>
    </form>
  );
}
