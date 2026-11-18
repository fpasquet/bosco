'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { useNotices } from '@/shared/hooks/use-notices';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { aboutQuery, changelogQuery, checkUpdates, chooseUpdates } from '../../api/about';
import { androidVersion } from '../../lib/version';
import { AboutSettings } from '../about-settings';

const noSubscription = () => () => undefined;

/** Réglages › À propos : la version, les mises à jour et le journal des versions. */
export function AboutScreen() {
  const phone = useIsPhone();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data } = useQuery(aboutQuery);
  const changelog = useQuery(changelogQuery);
  const androidApp = useSyncExternalStore(
    noSubscription,
    () => androidVersion(navigator.userAgent),
    () => null,
  );
  const onSaved = {
    onSuccess: (saved: Awaited<ReturnType<typeof checkUpdates>>) => client.setQueryData(aboutQuery.queryKey, saved),
  };
  const choose = useMutation({
    mutationFn: chooseUpdates,
    ...onSaved,
    onError: () => push('Le réglage des mises à jour n’a pas pu être enregistré.', 'warning'),
  });
  const check = useMutation({
    mutationFn: checkUpdates,
    ...onSaved,
    onError: () => push('La recherche d’une nouvelle version n’a pas abouti.', 'warning'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="about" />
      {data ? (
        <AboutSettings
          about={data}
          androidApp={androidApp}
          busy={choose.isPending || check.isPending}
          changelog={changelog.data ?? (changelog.isError ? '' : null)}
          phone={phone}
          onCheck={() => check.mutate()}
          onChoose={(choice) => choose.mutate(choice)}
        />
      ) : (
        <SectionSkeleton rows={4} />
      )}
    </div>
  );
}
