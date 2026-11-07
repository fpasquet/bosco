'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { RightsFieldDto } from '@bosco/domain';
import { repositoriesQuery, rightsQuery, RightsRefused, updateRights } from '../../api/tasks';
import { TASK_STATES } from '../../lib/tasks';
import { RightsTable } from '../rights-table';

const GENERAL = '';

/** Tâches › Droits des agents (E8a) : un dépôt, ou les réglages généraux ; sur le téléphone, en lecture seule. */
export function RightsScreen() {
  const client = useQueryClient();
  const { data: repositories } = useQuery(repositoriesQuery);
  const [chosen, setChosen] = useState<null | string>(null);
  const scope = chosen ?? repositories?.[0]?.name ?? GENERAL;
  const repository = scope === GENERAL ? null : scope;
  const { data } = useQuery({ ...rightsQuery(repository), enabled: repositories !== undefined });
  const [error, setError] = useState<null | string>(null);
  const save = useMutation({
    mutationFn: ({ field, value }: { field: RightsFieldDto; value: unknown }) =>
      updateRights(repository, { [field]: value }),
    onSuccess: async (rights) => {
      setError(null);
      client.setQueryData(rightsQuery(repository).queryKey, rights);
      await client.invalidateQueries({ queryKey: ['rights'] });
    },
    onError: (failure) =>
      setError(failure instanceof RightsRefused ? failure.message : 'Les droits n’ont pas pu être enregistrés.'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs text-muted">
            <Link href="/tasks" className="link">
              Tâches
            </Link>{' '}
            › Droits des agents
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Droits des agents</h1>
          <p className="text-muted">Une tâche peut resserrer ces droits, jamais les dépasser.</p>
        </div>
        <select
          aria-label="Dépôt"
          className="select w-56 select-sm md:ml-auto"
          value={scope}
          onChange={(event) => {
            setError(null);
            setChosen(event.target.value);
          }}
        >
          {(repositories ?? []).map(({ name }) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={GENERAL}>Réglages généraux</option>
        </select>
      </div>
      {data && (
        <RightsTable
          key={scope}
          rights={data}
          repository={repository}
          busy={save.isPending}
          error={error}
          onSave={(field, value) => save.mutateAsync({ field, value })}
        />
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <p className="flex items-start gap-2 rounded-card border border-line bg-surface-alt px-4 py-3 text-xs">
          <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted" />
          <span>
            <b className="font-semibold">Réservé à toi.</b> Une session ou un agent ne peut pas changer ces réglages
            pour s’accorder plus de droits.
          </span>
        </p>
        <p className="flex items-start gap-2 rounded-card border border-line bg-surface-alt px-4 py-3 text-xs">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted" />
          <span>
            <b className="font-semibold">Réglages Claude Code du dépôt.</b> Les interdits déjà écrits dans les réglages
            Claude Code du dépôt s’appliquent aussi.
          </span>
        </p>
      </div>
      {data && data.pending.length > 0 && (
        <p className="text-xs text-muted">
          {data.pending.map((task, index) => (
            <span key={task.id}>
              {index > 0 && ', '}
              <Link href={`/tasks/${task.id}`} className="link font-mono">
                T-{task.id}
              </Link>{' '}
              ({TASK_STATES[task.state].label.toLowerCase()})
            </span>
          ))}{' '}
          {data.pending.length > 1 ? 'appliqueront' : 'appliquera'} ces droits au lancement.
        </p>
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces droits sont réservés à toi.</p>
    </div>
  );
}
