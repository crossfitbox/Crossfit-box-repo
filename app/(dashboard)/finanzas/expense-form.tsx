interface CategoryOption {
  id: string;
  name: string;
}

export function ExpenseForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: CategoryOption[];
  initial?: {
    category_id?: string | null;
    description?: string;
    amount_cents?: number;
    currency?: string;
    expense_date?: string;
    recurring?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm text-secondary mb-1">Descripción</label>
        <input
          type="text"
          name="description"
          required
          defaultValue={initial?.description ?? ''}
          placeholder="Ej. Arriendo de septiembre"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Categoría</label>
        <select
          name="category_id"
          defaultValue={initial?.category_id ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-secondary mb-1">Monto</label>
          <input
            type="number"
            name="amount"
            min={0}
            step="0.01"
            required
            defaultValue={initial?.amount_cents ? initial.amount_cents / 100 : ''}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Moneda</label>
          <select
            name="currency"
            defaultValue={initial?.currency ?? 'COP'}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Fecha</label>
        <input
          type="date"
          name="expense_date"
          required
          defaultValue={initial?.expense_date ?? new Date().toISOString().slice(0, 10)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary">
        <input
          type="checkbox"
          name="recurring"
          defaultChecked={initial?.recurring ?? false}
          className="accent-accent"
        />
        Gasto recurrente (ej. arriendo mensual)
      </label>

      <button
        type="submit"
        className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start"
      >
        {submitLabel}
      </button>
    </form>
  );
}
