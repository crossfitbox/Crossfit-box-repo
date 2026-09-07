export function WodForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  initial?: {
    date?: string;
    title?: string | null;
    description?: string;
    score_type?: string;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="max-w-md flex flex-col gap-4">
      <div>
        <label className="block text-sm text-secondary mb-1">Fecha</label>
        <input
          type="date"
          name="date"
          required
          defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Título (opcional)</label>
        <input
          type="text"
          name="title"
          defaultValue={initial?.title ?? ''}
          placeholder="Ej. Fran, Heavy Day, Metcon del jueves"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Descripción del WOD</label>
        <textarea
          name="description"
          required
          rows={6}
          defaultValue={initial?.description ?? ''}
          placeholder={'Ej.\n21-15-9\nThrusters (43/30kg)\nPull-ups'}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary font-mono"
        />
      </div>

      <div>
        <label className="block text-sm text-secondary mb-1">Tipo de score</label>
        <select
          name="score_type"
          defaultValue={initial?.score_type ?? 'time'}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary"
        >
          <option value="time">Tiempo (menor gana)</option>
          <option value="reps">Repeticiones (mayor gana)</option>
          <option value="load">Carga / peso (mayor gana)</option>
          <option value="rounds">Rondas (mayor gana)</option>
        </select>
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
