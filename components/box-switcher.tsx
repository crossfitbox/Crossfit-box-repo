'use client';

import { useState, useRef, useEffect } from 'react';
import { switchActiveBox } from '@/lib/box-actions';
import type { StaffMembership } from '@/lib/require-staff';

export function BoxSwitcher({
  currentBoxId,
  memberships,
}: {
  currentBoxId: string;
  memberships: StaffMembership[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Con un solo box no hay nada que cambiar — no mostrar el selector.
  if (memberships.length <= 1) {
    const current = memberships.find((m) => m.boxId === currentBoxId);
    return (
      <span className="text-sm text-primary font-display">{current?.boxName}</span>
    );
  }

  const current = memberships.find((m) => m.boxId === currentBoxId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-primary font-display hover:opacity-80"
      >
        {current?.boxName}
        <span className="text-secondary text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-border rounded shadow-lg z-10 overflow-hidden">
          {memberships.map((m) => (
            <form key={m.boxId} action={switchActiveBox.bind(null, m.boxId)}>
              <button
                type="submit"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-border transition-colors ${
                  m.boxId === currentBoxId ? 'text-accent' : 'text-primary'
                }`}
              >
                {m.boxName}
                <span className="text-secondary text-xs block capitalize">{m.role}</span>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
