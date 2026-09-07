interface ClassTypeOption {
  id: string;
  name: string;
}
interface CoachOption {
  id: string;
  full_name: string;
}
interface LocationOption {
  id: string;
  name: string;
}

export function ClassForm({
  action,
  classTypes,
  coaches,
  locations,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  classTypes: ClassTypeOption[];
  coaches: CoachOption[];
  locations: LocationOption[];
  initial?: {
    class_type_id?: string | null;
    coach_id?: string | null;
    location_id?: string | null;
    starts_at?: string;
    ends_at?: string;
    capacity?: number;
  };
  submitLabel: string;
}) {
  const toLocalInput = (iso?: string) => (iso ? iso.slice(0, 16) : '');

  return (
    <form action={action} className="max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm text-secondary mb-1">Sede</label>
        <select
          name="location_id"
          required
          defaultValue={initial?.location_id ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="" disabled>
            Selecciona una sede
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Tipo de clase</label>
        <select
          name="class_type_id"
          defaultValue={initial?.class_type_id ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="">Sin especificar</option>
          {classTypes.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Coach</label>
        <select
          name="coach_id"
          defaultValue={initial?.coach_id ?? ''}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="">Sin asignar</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Inicio</label>
        <input
          type="datetime-local"
          name="starts_at"
          required
          defaultValue={toLocalInput(initial?.starts_at)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Fin</label>
        <input
          type="datetime-local"
          name="ends_at"
          required
          defaultValue={toLocalInput(initial?.ends_at)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Cupos</label>
        <input
          type="number"
          name="capacity"
          min={1}
          required
          defaultValue={initial?.capacity ?? 15}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <button
        type="submit"
        className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start"
      >
        {submitLabel}
      </button>
    </form>
  );
}
