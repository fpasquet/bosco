'use client';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { APP_NAME, type SourceDto } from '@bosco/domain';
import { channelProfilesQuery, installChannel, uninstallChannel } from '../../api/channel';
import { installLiveTracking, liveTrackingQuery, uninstallLiveTracking } from '../../api/live-tracking';
import { type SettingsDto, settingsQuery, updateSettings } from '../../api/settings';
import { setSourceWatched, sourcesQuery } from '../../api/sources';
import { useCopy } from '../../hooks/use-copy';
import { displayPath } from '../../lib/format';
import { ChannelPanel } from '../channel-panel';
import { LiveTrackingPanel, type LiveTrackingStep } from '../live-tracking-panel';
import { SettingsPanel } from '../settings-panel';
import { SourceCard } from '../source-card';

/** L'adresse ne change pas pendant la visite : rien à écouter */
const noSubscription = () => () => undefined;

/** Le dernier signal se relit à cet intervalle ; plus souvent pendant la vérification de l'installation. */
const STATUS_REFRESH_MS = 5000;
const CHECK_REFRESH_MS = 1500;

/** Sources (E4a) : les profils surveillés, leur suivi en direct, et l'installation pas à pas (E4b). */
export function SourcesScreen({ title }: { title: string }) {
  const now = useNow(STATUS_REFRESH_MS);
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data } = useQuery(sourcesQuery);
  const sources = data?.sources ?? [];
  const { data: settings } = useQuery(settingsQuery);
  const [selected, setSelected] = useState<null | SourceDto>(null);
  const [step, setStep] = useState<LiveTrackingStep>('intro');
  const statuses = useQueries({
    queries: sources.map((source) => ({
      ...liveTrackingQuery(source.id),
      refetchInterval: selected?.id === source.id && step === 'check' ? CHECK_REFRESH_MS : STATUS_REFRESH_MS,
    })),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: sourcesQuery.queryKey });
    await client.invalidateQueries({ queryKey: ['live-tracking'] });
  };
  const install = useMutation({
    mutationFn: ({ backup, id }: { backup: boolean; id: string }) => installLiveTracking(id, backup),
    onSuccess: async () => {
      await refresh();
      setStep('check');
    },
    onError: () => push('Les réglages du profil n’ont pas pu être écrits : ils ont été laissés tels quels.', 'warning'),
  });
  const uninstall = useMutation({
    mutationFn: (id: string) => uninstallLiveTracking(id),
    onSuccess: async () => {
      await refresh();
      setSelected(null);
      push('Suivi en direct retiré : les réglages d’avant sont remis.', 'info');
    },
  });
  const saveSettings = useMutation({
    mutationFn: (changes: Partial<SettingsDto>) => updateSettings(changes),
    onSuccess: (saved) => client.setQueryData(settingsQuery.queryKey, saved),
    onError: () => push('Le réglage n’a pas pu être enregistré.', 'warning'),
  });
  // Canal de Bosco (E4f) : son installation par profil ; « ?canal=1 » (depuis la bande d'E2a) ouvre le panneau
  const { data: channelProfiles } = useQuery(channelProfilesQuery);
  const [channelPath, setChannelPath] = useState<null | string>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  // « ?canal=<source> » : le panneau s'ouvre sur le profil de la session d'où vient le lien
  const fromLink = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(globalThis.location.search).get('canal'),
    () => null,
  );
  const copy = useCopy();
  const linked = sources.find((source) => source.id === fromLink)?.path ?? null;
  const openPath = channelPath ?? (linkDismissed ? null : linked);
  const channelChange = useMutation({
    mutationFn: ({ install: installing, path }: { install: boolean; path: string }) =>
      installing ? installChannel(path) : uninstallChannel(path),
    onSuccess: async (_, { install: installing }) => {
      await client.invalidateQueries({ queryKey: channelProfilesQuery.queryKey });
      if (!installing) {
        setChannelPath(null);
        setLinkDismissed(true);
        push('Canal de Bosco retiré du profil.', 'info');
      }
    },
    onError: (error) => push(error instanceof Error ? error.message : 'Le canal n’a pas changé.', 'warning'),
  });
  const channelOf = (path: string) => channelProfiles?.find((profile) => profile.path === path);
  const switchSource = useMutation({
    mutationFn: ({ id, watched }: { id: string; watched: boolean }) => setSourceWatched(id, watched),
    onSuccess: refresh,
  });
  if (!data) return <PageSkeleton variant="cards" rows={2} />;
  const watchedCount = sources.filter((source) => source.watched).length;
  const statusOf = (id: string) => statuses[sources.findIndex((source) => source.id === id)]?.data;
  const selectedStatus = selected ? statusOf(selected.id) : undefined;
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <div>
        <p className="text-xs text-muted">Poste local · lecture seule, rien n’est modifié sans ton accord</p>
        <h1 className="mt-1 hidden font-display text-2xl font-semibold tracking-tight md:block">{title}</h1>
      </div>
      <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
        Le suivi en direct s’installe depuis le poste : ouvre {APP_NAME} sur l’ordinateur, dans Sources, pour
        l’installer ou le retirer.
      </p>
      <section aria-labelledby="sources-title" className="rounded-card border border-line bg-surface shadow-card">
        <h2 id="sources-title" className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
          {watchedCount > 1 ? `${watchedCount} sources surveillées` : `${watchedCount} source surveillée`}
        </h2>
        <ul className="divide-y divide-line">
          {sources.map((source) => {
            const signal = statusOf(source.id)?.lastSignalAt;
            return (
              <SourceCard
                key={source.id}
                channel={
                  channelOf(source.path) && {
                    installed: channelOf(source.path)?.installed ?? false,
                    onOpen: () => setChannelPath(source.path),
                  }
                }
                label={source.label}
                path={displayPath(source.path, data.home)}
                liveTracking={source.liveTracking}
                watched={source.watched}
                onWatchedChange={(watched) => switchSource.mutate({ id: source.id, watched })}
                lastSignalAt={signal ? new Date(signal) : null}
                now={now}
                onOpenLiveTracking={() => {
                  setSelected(source);
                  setStep(source.liveTracking ? 'check' : 'intro');
                }}
              />
            );
          })}
        </ul>
      </section>
      {settings && (
        <SettingsPanel
          settings={settings}
          busy={saveSettings.isPending}
          onChange={(changes) => saveSettings.mutate(changes)}
        />
      )}
      <nav
        aria-label="Réglages du worker"
        className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface shadow-card md:hidden"
      >
        {[
          { href: '/settings/integrations', label: 'Intégrations' },
          { href: '/settings/repositories', label: 'Dépôts' },
          { href: '/settings/notifications', label: 'Notifications' },
          { href: '/settings/isolation', label: 'Isolation du worker' },
          { href: '/settings/test-environments', label: 'Environnements de test' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{label}</span>
            <ChevronRight aria-hidden className="size-4 text-muted" />
          </Link>
        ))}
      </nav>
      <ChannelPanel
        profile={(openPath && channelOf(openPath)) || null}
        shownPath={openPath ? displayPath(openPath, data.home) : ''}
        busy={channelChange.isPending}
        onCopy={copy}
        onClose={() => {
          setChannelPath(null);
          setLinkDismissed(true);
        }}
        onInstall={() => openPath && channelChange.mutate({ install: true, path: openPath })}
        onUninstall={() => openPath && channelChange.mutate({ install: false, path: openPath })}
      />
      <LiveTrackingPanel
        source={selected && { label: selected.label, path: displayPath(selected.path, data.home) }}
        status={
          selectedStatus && { ...selectedStatus, settingsPath: displayPath(selectedStatus.settingsPath, data.home) }
        }
        step={step}
        now={now}
        busy={install.isPending || uninstall.isPending}
        onStepChange={setStep}
        onClose={() => setSelected(null)}
        onInstall={(backup) => selected && install.mutate({ backup, id: selected.id })}
        onUninstall={() => selected && uninstall.mutate(selected.id)}
      />
    </div>
  );
}
