'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsTabs } from '@/shared/layouts/settings-tabs';
import { configureIntegration, ContextRefused, integrationsQuery, refreshLinks } from '../../api/context';
import { Integrations } from './integrations';

/** Réglages › Intégrations (E10a) ; en lecture seule sur le téléphone. */
export function IntegrationsScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const { data } = useQuery(integrationsQuery);
  const [error, setError] = useState<null | string>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ['integrations'] });
  const configure = useMutation({
    mutationFn: ({
      access,
      name,
    }: {
      access: Parameters<typeof configureIntegration>[1];
      name: 'confluence' | 'jira';
    }) => configureIntegration(name, access),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'L’accès n’a pas pu être enregistré.'),
  });
  const reread = useMutation({ mutationFn: refreshLinks, onSuccess: refresh });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">{title}</p>
        <SettingsTabs current="/settings/integrations" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Intégrations</h1>
      </div>
      {data && (
        <Integrations
          integrations={data.integrations}
          lastRefresh={data.lastRefresh}
          nextRefresh={data.nextRefresh}
          busy={configure.isPending || reread.isPending}
          error={error}
          onConfigure={(name, access) => configure.mutate({ name, access })}
          onRefresh={() => reread.mutate()}
        />
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
