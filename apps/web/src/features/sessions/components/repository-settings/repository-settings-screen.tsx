'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import type { DiscoverySettingsDto } from '@bosco/domain';
import { useNow } from '@/shared/hooks/use-now';
import { SettingsTabs } from '@/shared/layouts/settings-tabs';
import {
  RepositorySettingRefused,
  repositorySettingsQuery,
  updateRepositorySettings,
} from '../../api/repository-settings';
import { RepositorySettings } from './repository-settings';

const REFRESH_MS = 60_000;

/** Réglages › Dépôts (E4d) ; en lecture seule sur le téléphone. */
export function RepositorySettingsScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const now = useNow(REFRESH_MS);
  const { data } = useQuery(repositorySettingsQuery);
  const [error, setError] = useState<null | string>(null);
  const save = useMutation({
    mutationFn: (changes: Partial<DiscoverySettingsDto>) => updateRepositorySettings(changes),
    // Le dépôt de chaque session suit aussitôt (CA-SESS-82) : sessions, tâches, contexte et historique se relisent
    onSuccess: async () => {
      setError(null);
      await client.invalidateQueries();
    },
    onError: (failure) =>
      setError(
        failure instanceof RepositorySettingRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.',
      ),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">{title}</p>
        <SettingsTabs current="/settings/repositories" />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dépôts</h1>
          <span className="ml-auto hidden h-control items-center gap-2 rounded-control border border-line bg-surface px-3 text-muted md:inline-flex">
            <Lock aria-hidden className="size-4" />
            Réservé à toi
          </span>
        </div>
      </div>
      {data && (
        <RepositorySettings
          data={data}
          now={now}
          busy={save.isPending}
          error={error}
          onChange={(changes) => save.mutate(changes)}
        />
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
