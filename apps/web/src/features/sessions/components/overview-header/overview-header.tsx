'use client';
import { EyeOff, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { Grouping } from '../../lib/preferences';
import { dayLabel } from '../../lib/format';

export interface OverviewHeaderProps {
  grouping: Grouping;
  hideInactive: boolean;
  now: Date;
  onGroupingChange: (grouping: Grouping) => void;
  onHideInactiveChange: () => void;
  onQueryChange: (query: string) => void;
  query: string;
  /** Coût du jour, rappelé à côté du regroupement sur téléphone, sans la bande d'indicateurs */
  costToday?: string;
  /** Dépôt filtré (E1c), affiché en puce que la croix retire */
  repository: null | string;
  /** Sous-titre des colonnes par état, qui n'ont pas de bande d'indicateurs (E1d) */
  summary?: string;
  title: string;
}

const GROUPINGS: { label: string; value: Grouping }[] = [
  { label: 'Dépôt', value: 'repository' },
  { label: 'État', value: 'state' },
];

/** En-tête de la vue d'ensemble : regroupement gardé d'une visite à l'autre, recherche (raccourci « / »), filtres. */
export function OverviewHeader(props: OverviewHeaderProps) {
  const { grouping, hideInactive, now, onGroupingChange, onHideInactiveChange, onQueryChange, query, repository } =
    props;
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== '/' || target?.closest('input, textarea, [contenteditable]')) return;
      event.preventDefault();
      search.current?.focus();
    };
    globalThis.addEventListener('keydown', focusSearch);
    return () => globalThis.removeEventListener('keydown', focusSearch);
  }, []);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className={cn('min-w-0', !repository && 'hidden md:block')}>
        <p className="hidden text-xs text-muted md:block">{props.summary ?? `Poste local · ${dayLabel(now)}`}</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="hidden font-display text-2xl font-semibold tracking-tight md:block">{props.title}</h1>
          {repository && (
            <span className="badge gap-1.5 badge-outline">
              Dépôt : {repository}
              <Link
                href="/"
                aria-label={`Retirer le filtre Dépôt : ${repository}`}
                className="text-muted hover:text-ink"
              >
                <X aria-hidden className="size-3.5" />
              </Link>
            </span>
          )}
        </div>
      </div>
      <div className="flex w-full items-center gap-2 text-xs text-muted md:ml-auto md:w-auto">
        <span id="grouping-label">Regrouper par</span>
        <div role="group" aria-labelledby="grouping-label" className="flex rounded-control bg-surface-alt p-0.5">
          {GROUPINGS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              aria-pressed={grouping === value}
              onClick={() => onGroupingChange(value)}
              className="rounded-control px-2.5 py-1.5 aria-pressed:bg-surface aria-pressed:font-medium aria-pressed:text-ink aria-pressed:shadow-card"
            >
              {label}
            </button>
          ))}
        </div>
        {props.costToday && <span className="ml-auto tabular-nums md:hidden">{props.costToday} aujourd’hui</span>}
      </div>
      <label className="input hidden h-control w-64 md:flex">
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <input
          ref={search}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher une session"
          aria-label="Rechercher une session"
        />
        <kbd className="kbd kbd-sm">/</kbd>
      </label>
      {grouping === 'repository' && (
        <button
          type="button"
          aria-pressed={hideInactive}
          onClick={onHideInactiveChange}
          className={cn(
            'btn hidden h-control border-line bg-surface font-normal shadow-none md:inline-flex',
            hideInactive ? 'border-primary text-primary' : 'text-muted',
          )}
        >
          <EyeOff aria-hidden className="size-4" />
          Masquer les inactives
        </button>
      )}
    </div>
  );
}
