'use client';

import { useState, useTransition } from 'react';
import { searchMemberByName, kioskCheckIn } from './kiosk-actions';

interface MemberResult { profileId: string; name: string }

export function KioskCheckin({
  kioskTokenId,
}: {
  boxId: string;
  locationId: string | null;
  kioskTokenId: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberResult[]>([]);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const found = await searchMemberByName(kioskTokenId, value);
    setResults(found);
  }

  function handleCheckIn(member: MemberResult) {
    startTransition(async () => {
      await kioskCheckIn(kioskTokenId, member.profileId);
      setConfirmed(member.name);
      setQuery('');
      setResults([]);
      setTimeout(() => setConfirmed(null), 3000);
    });
  }

  if (confirmed) {
    return (
      <div className="text-center py-16">
        <div className="text-success text-5xl mb-4">✓</div>
        <p className="text-primary text-xl">¡Bienvenido, {confirmed.split(' ')[0]}!</p>
      </div>
    );
  }

  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Escribe tu nombre..."
        className="w-full bg-surface border border-border rounded px-4 py-3 text-lg text-primary text-center"
      />
      <div className="flex flex-col gap-2 mt-4">
        {results.map((m) => (
          <button
            key={m.profileId}
            onClick={() => handleCheckIn(m)}
            disabled={pending}
            className="bg-surface border border-border rounded px-4 py-3 text-primary text-left hover:border-accent transition-colors disabled:opacity-50"
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}
