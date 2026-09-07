export function PlanForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: {
    name?: string;
    classes_per_period?: number | null;
    price_cents?: number;
    currency?: string;
    period?: string;
    active?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm text-secondary mb-1">Nombre del plan</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          placeholder="Ej. Ilimitado, 8 clases/mes"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">
          Clases por período (vacío = ilimitado)
        </label>
        <input
          type="number"
          name="classes_per_period"
          min={1}
          defaultValue={initial?.classes_per_period ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-secondary mb-1">Precio</label>
          <input
            type="number"
            name="price"
            min={0}
            step="0.01"
            required
            defaultValue={initial?.price_cents ? initial.price_cents / 100 : ''}
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
        <label className="block text-sm text-secondary mb-1">Periodo</label>
        <select
          name="period"
          defaultValue={initial?.period ?? 'monthly'}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="monthly">Mensual</option>
          <option value="annual">Anual</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="accent-accent"
        />
        Plan activo (visible para nuevos suscriptores)
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
