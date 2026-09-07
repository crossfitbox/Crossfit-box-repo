'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle('light', next);
    localStorage.setItem('box-admin-theme', next ? 'light' : 'dark');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="text-secondary hover:text-primary transition-colors text-sm flex items-center gap-1.5"
    >
      {isLight ? '☾' : '☀'} {isLight ? 'Oscuro' : 'Claro'}
    </button>
  );
}
