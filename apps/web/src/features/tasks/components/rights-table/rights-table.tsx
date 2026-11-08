'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { RightsDto, RightsFieldDto, RightsValuesDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { modelLabel, PULL_REQUEST_LABELS, RIGHTS_FIELDS, RIGHTS_LABELS, rightsValue } from '../../lib/rights';
import { type AccountField, AccountItems, AccountRows } from './account-rows';

export interface RightsTableProps {
  busy: boolean;
  /** Refus de l'API pour la ligne en cours de modification */
  error: null | string;
  /** Nom du dépôt ; null pour les réglages généraux */
  repository: null | string;
  rights: RightsDto;
  /** Abonnement Claude ou compte GitHub du dépôt ; null revient au défaut */
  onAccount: (field: AccountField, value: null | string) => Promise<unknown>;
  /** null : revenir au général ; la promesse échoue quand l'API refuse la valeur */
  onSave: (field: RightsFieldDto, value: unknown) => Promise<unknown>;
}

/** Valeur saisie → valeur envoyée ; une liste d'outils s'écrit une par ligne. */
function parse(field: RightsFieldDto, text: string): unknown {
  if (field === 'tools' || field === 'deniedTools')
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  if (field === 'maxBudgetUsd') return Number(text.replace(',', '.'));
  if (field === 'maxTurns' || field === 'concurrency') return Number(text);
  return text;
}

function draftOf(field: RightsFieldDto, value: RightsValuesDto[RightsFieldDto]): string {
  return Array.isArray(value) ? value.join('\n') : String(value);
}

function Editor({
  busy,
  error,
  field,
  models,
  onCancel,
  onSave,
  value,
}: {
  busy: boolean;
  error: null | string;
  field: RightsFieldDto;
  models: string[];
  onCancel: () => void;
  onSave: (value: unknown) => void;
  value: RightsValuesDto[RightsFieldDto];
}) {
  const { handleSubmit, register } = useForm({ defaultValues: { text: draftOf(field, value) } });
  const id = `rights-${field}`;
  const label = RIGHTS_LABELS[field];
  let input: React.ReactNode;
  if (field === 'model')
    input = (
      <select id={id} className="select select-sm" {...register('text')}>
        {models.map((model) => (
          <option key={model} value={model}>
            {modelLabel(model)}
          </option>
        ))}
      </select>
    );
  else if (field === 'pullRequest')
    input = (
      <select id={id} className="select select-sm" {...register('text')}>
        {Object.entries(PULL_REQUEST_LABELS).map(([mode, modeLabel]) => (
          <option key={mode} value={mode}>
            {modeLabel}
          </option>
        ))}
      </select>
    );
  else if (field === 'tools' || field === 'deniedTools')
    input = (
      <textarea
        id={id}
        rows={4}
        className="textarea font-mono textarea-sm"
        placeholder={field === 'tools' ? 'Read\nBash(npm test)' : 'Bash(curl:*)\nRead(.env*)'}
        {...register('text')}
      />
    );
  else input = <input id={id} inputMode="decimal" className="input w-32 input-sm" {...register('text')} />;
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(event) => void handleSubmit(({ text }) => onSave(parse(field, text)))(event)}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {input}
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="xs" disabled={busy}>
          Enregistrer
        </Button>
        <Button type="button" size="xs" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/**
 * Droits des agents (E8a), ligne par ligne : la valeur générale, celle du dépôt et celle qui s'applique, avec son
 * origine. Une tâche peut resserrer ces droits, jamais les dépasser.
 */
export function RightsTable({ busy, error, onAccount, onSave, repository, rights }: RightsTableProps) {
  const [editing, setEditing] = useState<null | RightsFieldDto>(null);
  const own = rights.repository;
  const save = (field: RightsFieldDto, value: unknown) =>
    onSave(field, value).then(
      () => setEditing(null),
      // Refusée : la ligne reste ouverte, avec le message
      () => undefined,
    );
  return (
    <>
      <div className="hidden overflow-x-auto rounded-card border border-line bg-surface shadow-card md:block">
        <table className="table">
          <thead className="text-ink">
            <tr>
              <th scope="col">Réglage</th>
              <th scope="col">Général</th>
              {repository && <th scope="col">{repository}</th>}
              {repository && <th scope="col">Effectif</th>}
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {RIGHTS_FIELDS.map((field) => {
              const hasOwn = own !== null && field in own;
              return (
                <tr key={field} className="align-top">
                  <th scope="row" className="font-medium">
                    {RIGHTS_LABELS[field]}
                  </th>
                  <td className={cn(repository && 'text-muted')}>
                    {editing === field && !repository ? (
                      <Editor
                        busy={busy}
                        error={error}
                        field={field}
                        models={rights.models}
                        value={rights.general[field]}
                        onCancel={() => setEditing(null)}
                        onSave={(value) => void save(field, value)}
                      />
                    ) : (
                      rightsValue(field, rights.general[field])
                    )}
                  </td>
                  {repository && (
                    <td>
                      {editing === field && (
                        <Editor
                          busy={busy}
                          error={error}
                          field={field}
                          models={rights.models}
                          value={rights.effective[field]}
                          onCancel={() => setEditing(null)}
                          onSave={(value) => void save(field, value)}
                        />
                      )}
                      {editing !== field && hasOwn && rightsValue(field, rights.effective[field])}
                      {editing !== field && !hasOwn && <span className="text-muted">hérité</span>}
                    </td>
                  )}
                  {repository && (
                    <td>
                      <span className="flex flex-col gap-0.5">
                        {rightsValue(field, rights.effective[field])}
                        <span className="text-xs text-muted">{rights.origins[field]}</span>
                      </span>
                    </td>
                  )}
                  <td>
                    {editing !== field && (
                      <span className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          aria-label={`Modifier : ${RIGHTS_LABELS[field]}`}
                          disabled={busy}
                          onClick={() => setEditing(field)}
                        >
                          Modifier
                        </Button>
                        {hasOwn && (
                          <Button
                            size="xs"
                            variant="ghost"
                            aria-label={`Revenir au général : ${RIGHTS_LABELS[field]}`}
                            disabled={busy}
                            onClick={() => void save(field, null)}
                          >
                            Revenir au général
                          </Button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            <AccountRows
              accounts={rights.accounts}
              busy={busy}
              error={error}
              repository={repository}
              onSave={onAccount}
            />
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface shadow-card md:hidden">
        {RIGHTS_FIELDS.map((field) => (
          <li key={field} className="flex flex-col gap-0.5 px-4 py-3">
            <span className="flex items-center justify-between gap-3">
              <span className="font-medium">{RIGHTS_LABELS[field]}</span>
              <span className="text-xs text-muted">{rights.origins[field]}</span>
            </span>
            <span>{rightsValue(field, rights.effective[field])}</span>
            {repository && own !== null && field in own && (
              <span className="text-xs text-muted">Général : {rightsValue(field, rights.general[field])}</span>
            )}
          </li>
        ))}
        <AccountItems accounts={rights.accounts} repository={repository} />
      </ul>
    </>
  );
}
