'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { SettingsTabs } from '@/shared/layouts/settings-tabs';
import { integrationsQuery, refreshLinks } from '../../api/context';
import { Integrations } from './integrations';

/** Réglages › Intégrations (E10a) ; en lecture seule sur le téléphone. */
export function IntegrationsScreen({ title }: { title: string }) {
  const client = useQueryClient();
  const { data } = useQuery(integrationsQuery);
  const refresh = () => client.invalidateQueries({ queryKey: ['integrations'] });
  const reread = useMutation({ mutationFn: refreshLinks, onSuccess: refresh });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted">{title}</p>
        <SettingsTabs current="/settings/integrations" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Intégrations</h1>
      </div>
      {!data && <SectionSkeleton rows={4} />}
      {data && (
        <Integrations
          integrations={data.integrations}
          lastRefresh={data.lastRefresh}
          nextRefresh={data.nextRefresh}
          busy={reread.isPending}
          onRefresh={() => reread.mutate()}
        />
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
