'use client';

import { useState, useTransition } from 'react';
import { createProduct, restockProduct, registerSale } from './actions';

export function NewProductForm() {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity">
        Nuevo producto
      </button>
    );
  }

  return (
    <form
      action={(fd) => startTransition(async () => { await createProduct(fd); setOpen(false); })}
      className="border border-border rounded p-4 max-w-lg flex flex-col gap-3"
    >
      <input name="name" required placeholder="Nombre" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <input name="sku" placeholder="SKU (opcional)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
      <div className="grid grid-cols-3 gap-3">
        <input name="cost" type="number" step="0.01" min={0} placeholder="Costo" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <input name="price" type="number" step="0.01" min={0} required placeholder="Precio venta" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
        <input name="stock" type="number" min={0} placeholder="Stock inicial" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
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

export function ProductRowActions({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-3 justify-end items-center">
      <form
        action={(fd) => startTransition(() => restockProduct(fd))}
        className="flex items-center gap-1"
      >
        <input type="hidden" name="product_id" value={productId} />
        <input name="quantity" type="number" placeholder="+/-" className="w-16 bg-surface border border-border rounded px-2 py-1 text-xs text-primary" />
        <button type="submit" disabled={pending} className="text-xs text-secondary hover:text-primary">
          Ajustar stock
        </button>
      </form>
      <form
        action={(fd) => startTransition(() => registerSale(fd))}
        className="flex items-center gap-1"
      >
        <input type="hidden" name="product_id" value={productId} />
        <input name="quantity" type="number" min={1} defaultValue={1} className="w-14 bg-surface border border-border rounded px-2 py-1 text-xs text-primary" />
        <button type="submit" disabled={pending} className="text-xs text-accent hover:opacity-80">
          Vender
        </button>
      </form>
    </div>
  );
}
