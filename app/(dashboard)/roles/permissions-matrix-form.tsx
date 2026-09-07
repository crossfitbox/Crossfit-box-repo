'use client';

import { useState, useTransition } from 'react';
import { savePermissionMatrix } from './actions';

type Row = {
  role: string;
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

const RESOURCE_LABELS: Record<string, string> = {
  classes: 'Clases',
  wods: 'WODs',
  members: 'Miembros',
  plans: 'Planes',
  expenses: 'Gastos',
  leads: 'Prospectos',
  finance: 'Finanzas',
  settings: 'Configuración',
  locations: 'Sedes',
  credits: 'Créditos',
  audit: 'Auditoría',
};

const ACTIONS: Array<{ key: keyof Row; label: string }> = [
  { key: 'can_view', label: 'Ver' },
  { key: 'can_create', label: 'Crear' },
  { key: 'can_edit', label: 'Editar' },
  { key: 'can_delete', label: 'Borrar' },
];

export function PermissionsMatrixForm({
  initialRows,
  roles,
  roleLabels,
}: {
  initialRows: Row[];
  roles: string[];
  roleLabels: Record<string, string>;
}) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(role: string, resource: string, key: keyof Row) {
    setRows((prev) =>
      prev.map((r) =>
        r.role === role && r.resource === resource ? { ...r, [key]: !r[key] } : r,
      ),
    );
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await savePermissionMatrix(JSON.stringify(rows));
      setSaved(true);
    });
  }

  const resources = Object.keys(RESOURCE_LABELS);

  return (
    <div>
      {roles.map((role) => (
        <div key={role} className="mb-10">
          <h2 className="font-display text-sm font-medium mb-3">{roleLabels[role] ?? role}</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Recurso</th>
                {ACTIONS.map((a) => (
                  <th key={a.key} className="text-center">
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((resource) => {
                const row = rows.find((r) => r.role === role && r.resource === resource);
                if (!row) return null;
                return (
                  <tr key={resource}>
                    <td>{RESOURCE_LABELS[resource]}</td>
                    {ACTIONS.map((a) => (
                      <td key={a.key} className="text-center">
                        <input
                          type="checkbox"
                          checked={row[a.key] as boolean}
                          onChange={() => toggle(role, resource, a.key)}
                          className="accent-accent w-4 h-4"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={pending}
          className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {saved && <span className="text-success text-sm">Guardado</span>}
      </div>
    </div>
  );
}
