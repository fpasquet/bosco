'use client';
import type { ReactNode } from 'react';
import { RotateCcw, Table, X } from 'lucide-react';
import { modelName } from '@/shared/lib/session-settings';
import { Segmented } from '@/shared/ui/segmented';
import { DEFAULT_FILTERS, type UsageFilters as Filters, isDefault, PERIODS } from '../../lib/filters';

export interface UsageFiltersProps {
  filters: Filters;
  groups: { id: number; name: string }[];
  models: string[];
  onChange: (filters: Filters) => void;
  onTable: () => void;
  profiles: { id: string; label: string }[];
  projects: { id: number; name: string }[];
  /** Vue en tableau ouverte */
  table: boolean;
}

function Select({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex shrink-0 items-center">
      <select
        aria-label={label}
        className="select h-control select-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

/**
 * Ligne de filtres de la page Usage (E23a, E23b) : période, profil, projet ou groupe, modèle. Un projet ou un groupe
 * choisi devient une puce qui se retire d'un clic ; « Réinitialiser » remet les valeurs par défaut (30 j, tous). Sur le
 * téléphone, la ligne défile.
 */
export function UsageFilters({
  filters,
  groups,
  models,
  onChange,
  onTable,
  profiles,
  projects,
  table,
}: UsageFiltersProps) {
  const set = (changes: Partial<Filters>) => onChange({ ...filters, ...changes });
  const scopeName =
    filters.scope?.kind === 'group'
      ? groups.find(({ id }) => id === filters.scope?.id)?.name
      : projects.find(({ id }) => id === filters.scope?.id)?.name;
  const scopeKind = filters.scope?.kind === 'group' ? 'Groupe' : 'Projet';
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
      <Segmented label="Période" options={PERIODS} value={filters.period} onChange={(period) => set({ period })} />
      {filters.scope ? (
        <span className="badge flex h-control shrink-0 items-center gap-1.5 badge-outline px-3">
          <span className="text-muted">{scopeKind}</span>
          <b className="font-medium">{scopeName ?? `n° ${filters.scope.id}`}</b>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-xs"
            aria-label={`Retirer le filtre ${scopeKind} : ${scopeName ?? ''}`}
            onClick={() => set({ scope: null })}
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </span>
      ) : (
        <Select
          label="Projet ou groupe"
          value=""
          onChange={(value) => {
            const [kind, id] = value.split(':');
            set({ scope: kind && id ? { kind: kind as 'group' | 'project', id: Number(id) } : null });
          }}
        >
          <option value="">Tous les projets et groupes</option>
          {groups.length > 0 && (
            <optgroup label="Groupes">
              {groups.map(({ id, name }) => (
                <option key={id} value={`group:${id}`}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
          {projects.length > 0 && (
            <optgroup label="Projets">
              {projects.map(({ id, name }) => (
                <option key={id} value={`project:${id}`}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      )}
      <Select label="Profil" value={filters.profile ?? ''} onChange={(value) => set({ profile: value || null })}>
        <option value="">Tous les profils</option>
        {profiles.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </Select>
      <Select label="Modèle" value={filters.model ?? ''} onChange={(value) => set({ model: value || null })}>
        <option value="">Tous les modèles</option>
        {[...new Set([...models, ...(filters.model ? [filters.model] : [])])].map((model) => (
          <option key={model} value={model}>
            {modelName(model)}
          </option>
        ))}
      </Select>
      <span className="flex shrink-0 items-center gap-1 md:ml-auto">
        {!isDefault(filters) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            <RotateCcw aria-hidden className="size-3.5" />
            Réinitialiser
          </button>
        )}
        <button
          type="button"
          aria-pressed={table}
          className="btn hidden btn-ghost btn-sm md:inline-flex"
          onClick={onTable}
        >
          <Table aria-hidden className="size-3.5" />
          Voir en tableau
        </button>
      </span>
    </div>
  );
}
