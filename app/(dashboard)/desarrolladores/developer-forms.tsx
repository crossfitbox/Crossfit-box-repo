'use client';

import { useState, useTransition } from 'react';
import { createApiKey, revokeApiKey, createWebhook, deleteWebhook } from './actions';

export function NewApiKeyForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  if (revealedKey) {
    return (
      <div className="border border-warning rounded p-4 max-w-lg bg-warning/5">
        <p className="text-sm text-primary mb-2">Copia esta llave ahora — no se volverá a mostrar:</p>
        <code className="block bg-surface border border-border rounded px-3 py-2 text-xs text-primary break-all mb-3">{revealedKey}</code>
        <button onClick={() => setRevealedKey(null)} className="text-xs text-secondary hover:text-primary">
          Entendido, ya la copié
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nueva API key
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => {
        const key = await createApiKey(fd);
        setOpen(false);
        setRevealedKey(key);
      })}
      className="border border-border rounded p-4 max-w-md flex flex-col gap-3"
    >
      <input name="name" required placeholder="Ej. Integración contabilidad" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="flex gap-4 text-sm text-secondary">
        <label className="flex items-center gap-2"><input type="checkbox" name="scopes" value="read" defaultChecked className="accent-accent" /> Lectura</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="scopes" value="write" className="accent-accent" /> Escritura</label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Generando...' : 'Generar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}

export function RevokeKeyButton({ keyId }: { keyId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button onClick={() => startTransition(() => revokeApiKey(keyId))} disabled={pending} className="text-xs text-accent hover:opacity-80">
      Revocar
    </button>
  );
}

const AVAILABLE_EVENTS = ['booking.created', 'payment.paid', 'audit.log'];

export function NewWebhookForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo webhook
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createWebhook(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <input name="url" type="url" required placeholder="https://tu-sistema.com/webhooks/box" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="flex flex-col gap-1 text-sm text-secondary">
        {AVAILABLE_EVENTS.map((ev) => (
          <label key={ev} className="flex items-center gap-2">
            <input type="checkbox" name="events" value={ev} className="accent-accent" /> {ev}
          </label>
        ))}
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

export function DeleteWebhookButton({ webhookId }: { webhookId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button onClick={() => startTransition(() => deleteWebhook(webhookId))} disabled={pending} className="text-xs text-accent hover:opacity-80">
      Borrar
    </button>
  );
}
