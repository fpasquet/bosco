'use client';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { SessionStateDto } from '@bosco/domain';
import type { HistoryFilters as Filters } from '../../api/history';
import { STATE_LABELS } from '../../lib/overview';

export interface HistoryFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  profiles: { id: string; label: string }[];
  repositories: string[];
}

const PERIODS: { label: string; value: null | number }[] = [
  { label: '7 derniers jours', value: 7 },
  { label: '30 derniers jours', value: 30 },
  { label: 'tout', value: null },
];

const STATES: SessionStateDto[] = ['waiting', 'running', 'inactive', 'ended'];

function Chip({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-control border border-line bg-surface pl-3 text-xs text-muted">
      {label}
      <select
        className="select select-ghost font-medium text-ink select-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

/** Recherche et filtres en puces de l'historique, qui se cumulent (CA-SESS-47, CA-SESS-48). */
export function HistoryFilters({ filters, onChange, profiles, repositories }: HistoryFiltersProps) {
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== '/' || target?.closest('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      search.current?.focus();
    };
    globalThis.addEventListener('keydown', focusSearch);
    return () => globalThis.removeEventListener('keydown', focusSearch);
  }, []);
  const set = (changes: Partial<Filters>) => onChange({ ...filters, ...changes });
  return (
    <div className="flex flex-col gap-3">
      <label className="input h-control w-full">
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <input
          ref={search}
          type="search"
          aria-label="Rechercher dans les titres, messages et commandes"
          placeholder="Rechercher dans les titres, messages et commandes"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
        />
        <kbd className="kbd kbd-sm">/</kbd>
      </label>
      <div className="flex flex-wrap gap-2">
        <Chip
          label="Période"
          value={String(filters.days ?? '')}
          onChange={(value) => set({ days: value ? Number(value) : null })}
        >
          {PERIODS.map((period) => (
            <option key={period.label} value={period.value ?? ''}>
              {period.label}
            </option>
          ))}
        </Chip>
        <Chip label="Dépôt" value={filters.repository ?? ''} onChange={(value) => set({ repository: value || null })}>
          <option value="">tous</option>
          {repositories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Chip>
        <Chip label="Profil" value={filters.profile ?? ''} onChange={(value) => set({ profile: value || null })}>
          <option value="">tous</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </Chip>
        <Chip
          label="État"
          value={filters.state ?? ''}
          onChange={(value) => set({ state: (value || null) as null | SessionStateDto })}
        >
          <option value="">tous</option>
          {STATES.map((state) => (
            <option key={state} value={state}>
              {STATE_LABELS[state]}
            </option>
          ))}
        </Chip>
      </div>
    </div>
  );
}
