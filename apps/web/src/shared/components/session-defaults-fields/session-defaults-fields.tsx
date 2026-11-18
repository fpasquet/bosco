'use client';
import { useId } from 'react';
import type {
  DefaultOriginDto,
  EffortDto,
  PermissionModeDto,
  SessionDefaultsDto,
  SessionDefaultsResolvedDto,
} from '@bosco/domain';
import {
  AUTO_MODE_UNAVAILABLE,
  EFFORT_CHOICES,
  effortName,
  MODEL_CHOICES,
  modelName,
  originLabel,
  PERMISSION_MODE_OPTIONS,
  permissionModeOption,
  supportsAutoMode,
} from '@/shared/lib/session-settings';

export interface SessionDefaultsFieldsProps {
  busy: boolean;
  /** Valeurs réglées à ce niveau (projet, groupe) ; null : hériter */
  defaults: SessionDefaultsDto;
  /** Valeurs qu'aurait une nouvelle session de ce niveau, avec leur origine : ce qu'une ligne « Hériter » reprend */
  inherited: SessionDefaultsResolvedDto | undefined;
  onChange: (changes: Partial<SessionDefaultsDto>) => void;
  /** Un groupe : le projet d'où vient une valeur est son projet principal */
  principal?: boolean;
  profiles: readonly { label: string; path: string }[];
}

type Key = keyof SessionDefaultsDto;

interface Row {
  key: Key;
  label: string;
  options: { disabled?: boolean; label: string; value: string }[];
  valueLabel: (value: null | string) => string;
}

/** Ce que dit une ligne sous son sélecteur : « Réglé ici », ou d'où vient la valeur héritée et laquelle. */
function helpOf(
  own: null | string,
  inherited: { origin: DefaultOriginDto; value: null | string } | undefined,
  row: Row,
  principal: boolean,
): string {
  if (own !== null) return 'Réglé ici';
  if (!inherited) return 'Hérité';
  const origin = originLabel(inherited.origin, { principal });
  return origin
    ? `Hérité · ${origin} (${row.valueLabel(inherited.value)})`
    : `Hérité (${row.valueLabel(inherited.value)})`;
}

/**
 * Valeurs par défaut des sessions d'un projet ou d'un groupe : profil, autorisations, modèle et effort,
 * chacun avec un sélecteur dont la première option est « Hériter » ; une ligne héritée dit d'où vient sa valeur. Sur le
 * téléphone, les valeurs se lisent seulement.
 */
export function SessionDefaultsFields({
  busy,
  defaults,
  inherited,
  onChange,
  principal = false,
  profiles,
}: SessionDefaultsFieldsProps) {
  const baseId = useId();
  const model = defaults.model ?? inherited?.model.value ?? null;
  const auto = supportsAutoMode(model);
  const profileName = (path: null | string) => profiles.find((profile) => profile.path === path)?.label ?? path ?? '—';
  const rows: Row[] = [
    {
      key: 'profile',
      label: 'Profil',
      options: profiles.map(({ label, path }) => ({ label, value: path })),
      valueLabel: profileName,
    },
    {
      key: 'permissionMode',
      label: 'Autorisations',
      options: PERMISSION_MODE_OPTIONS.map(({ label, value }) => ({
        label: value === 'auto' && !auto ? `${label} · ${AUTO_MODE_UNAVAILABLE}` : label,
        value,
        disabled: value === 'auto' && !auto,
      })),
      valueLabel: (value) => (value ? permissionModeOption(value as PermissionModeDto).label : 'Demander'),
    },
    {
      key: 'model',
      label: 'Modèle',
      options: MODEL_CHOICES.map(({ label, value }) => ({ label, value })),
      valueLabel: modelName,
    },
    {
      key: 'effort',
      label: 'Effort',
      options: EFFORT_CHOICES.map(({ label, value }) => ({ label, value })),
      valueLabel: (value) => effortName(value as EffortDto | null),
    },
  ];
  return (
    <dl className="flex flex-col gap-3">
      {rows.map((row) => {
        const own = defaults[row.key];
        const help = helpOf(own, inherited?.[row.key], row, principal);
        const id = `${baseId}-${row.key}`;
        return (
          <div key={row.key} className="flex flex-wrap items-start gap-x-4 gap-y-1">
            <dt className="w-44 shrink-0 pt-2 text-muted max-md:pt-0">
              <label htmlFor={id}>{row.label}</label>
            </dt>
            <dd className="flex min-w-0 flex-col gap-1">
              <select
                id={id}
                className="select hidden w-64 md:inline-flex"
                value={own ?? ''}
                disabled={busy}
                aria-describedby={`${id}-help`}
                onChange={(event) => onChange({ [row.key]: event.target.value || null })}
              >
                <option value="">Hériter</option>
                {row.options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              {own !== null && <span className="md:hidden">{row.valueLabel(own)}</span>}
              <span id={`${id}-help`} className="text-xs text-muted">
                {help}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
