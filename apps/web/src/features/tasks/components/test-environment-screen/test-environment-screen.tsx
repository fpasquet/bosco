'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsTabs } from '@/shared/layouts/settings-tabs';
import { repositoriesQuery } from '../../api/tasks';
import {
  type EnvironmentChanges,
  EnvironmentRefused,
  testEnvironmentQuery,
  updateTestEnvironment,
} from '../../api/test-environment';
import { TestEnvironment } from '../test-environment';

/** Réglages › Environnements de test (E12a) : un dépôt à la fois ; sur le téléphone, en lecture seule. */
export function TestEnvironmentScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const { data: repositories } = useQuery(repositoriesQuery);
  const [chosen, setChosen] = useState<null | string>(null);
  const repository = chosen ?? repositories?.[0]?.name ?? null;
  const { data } = useQuery({ ...testEnvironmentQuery(repository ?? ''), enabled: repository !== null });
  const [error, setError] = useState<null | string>(null);
  const save = useMutation({
    mutationFn: (changes: EnvironmentChanges) => updateTestEnvironment(repository ?? '', changes),
    onSuccess: (environment) => {
      setError(null);
      client.setQueryData(testEnvironmentQuery(environment.repository).queryKey, environment);
    },
    onError: (failure) =>
      setError(failure instanceof EnvironmentRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">{title}</p>
        <SettingsTabs current="/settings/test-environments" />
        <div className="flex flex-wrap items-end gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Environnement de test</h1>
          {repositories && repositories.length > 0 && (
            <select
              aria-label="Dépôt"
              className="select w-56 select-sm md:ml-auto"
              value={repository ?? ''}
              onChange={(event) => {
                setError(null);
                setChosen(event.target.value);
              }}
            >
              {repositories.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {repositories?.length === 0 && (
        <p className="text-muted">
          Aucun dépôt connu pour l’instant : ils viennent des sessions des profils surveillés.
        </p>
      )}
      {data && (
        <TestEnvironment
          key={data.repository}
          environment={data}
          busy={save.isPending}
          error={error}
          now={new Date()}
          onChange={(changes) => save.mutate(changes)}
        />
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
