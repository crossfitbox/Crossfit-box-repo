'use client';

import { useTransition } from 'react';
import { setRetentionPolicy } from './actions';

const ENTITIES = ['audit_log', 'webhook_deliveries', 'automation_log', 'api_request_log'];

export function RetentionForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form action={(fd) => startTransition(() => setRetentionPolicy(fd))} className="flex items-center gap-2">
      <select name="entity_type" required className="bg-surface border border-border rounded px-2 py-1.5 text-sm text-primary">
        {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
      </select>
      <input name="retain_days" type="number" min={1} required placeholder="días" className="w-20 bg-surface border border-border rounded px-2 py-1.5 text-sm text-primary" />
      <button type="submit" disabled={pending} className="text-sm text-accent hover:opacity-80">
        {pending ? '...' : 'Guardar'}
      </button>
    </form>
  );
}
