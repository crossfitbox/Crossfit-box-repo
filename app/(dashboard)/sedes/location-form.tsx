export function LocationForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    is_primary?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm text-secondary mb-1">Nombre de la sede</label>
        <input
          type="text"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          placeholder="Ej. Sede Norte, Sede Chapinero"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Dirección</label>
        <input
          type="text"
          name="address"
          defaultValue={initial?.address ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Teléfono</label>
        <input
          type="tel"
          name="phone"
          defaultValue={initial?.phone ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-secondary">
        <input
          type="checkbox"
          name="is_primary"
          defaultChecked={initial?.is_primary ?? false}
          className="accent-accent"
        />
        Sede principal
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
