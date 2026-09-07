'use client';

import { useState, useTransition } from 'react';
import { createDocumentVersion } from './actions';

export function NewDocumentForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nueva versión de documento
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createDocumentVersion(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <select name="type" required className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary">
        <option value="waiver">Exoneración de responsabilidad</option>
        <option value="reglamento">Reglamento</option>
        <option value="consentimiento">Consentimiento</option>
        <option value="privacidad">Política de privacidad</option>
      </select>
      <input name="title" required placeholder="Título" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <textarea name="content" required rows={6} placeholder="Contenido del documento (texto o markdown)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <label className="flex items-center gap-2 text-sm text-secondary">
        <input type="checkbox" name="required" defaultChecked className="accent-accent" />
        Obligatorio para reservar/hacer check-in
      </label>
      <p className="text-xs text-secondary">
        Publicar una nueva versión desactiva la anterior — los atletas que ya
        aceptaron la vieja conservan su historial, pero deberán aceptar esta
        si es obligatoria.
      </p>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50">
          {pending ? 'Publicando...' : 'Publicar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-secondary text-sm px-4 py-2 hover:text-primary">Cancelar</button>
      </div>
    </form>
  );
}
