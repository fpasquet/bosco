'use client';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, FolderPlus, Monitor } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { postToAndroidApp, useAndroidApp } from '@/shared/hooks/use-android-app';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { Button } from '@/shared/ui/button';
import { APP_NAME, type SourceDto } from '@bosco/domain';
import { channelProfilesQuery, installChannel, uninstallChannel } from '../../api/channel';
import { installLiveTracking, liveTrackingQuery, uninstallLiveTracking } from '../../api/live-tracking';
import { sessionsQuery } from '../../api/sessions';
import { type SettingsDto, settingsQuery, updateSettings } from '../../api/settings';
import { addSource, FolderRefused, setSourceWatched, sourcesQuery } from '../../api/sources';
import { useCopy } from '../../hooks/use-copy';
import { displayPath } from '../../lib/format';
import { sandboxActivity } from '../../lib/sources';
import { AddFolderDialog } from '../add-folder-dialog';
import { ChannelPanel } from '../channel-panel';
import { LiveTrackingPanel, type LiveTrackingStep } from '../live-tracking-panel';
import { SettingsPanel } from '../settings-panel';
import { ManagedSourceCard, SourceCard } from '../source-card';

/** L'adresse ne change pas pendant la visite : rien à écouter */
const noSubscription = () => () => undefined;

/** Le dernier signal se relit à cet intervalle ; plus souvent pendant la vérification de l'installation. */
const STATUS_REFRESH_MS = 5000;
const CHECK_REFRESH_MS = 1500;

function refusalOf(error: Error): string {
  return error instanceof FolderRefused ? error.message : 'Le dossier n’a pas pu être ajouté.';
}

/** Étape où s'ouvre le panneau du suivi en direct : à mettre à jour, il s'ouvre sur l'installation. */
function firstStep(installed: boolean, outdated: boolean): LiveTrackingStep {
  if (outdated) return 'install';
  return installed ? 'check' : 'intro';
}

/**
 * Réglages › Sources : les profils surveillés, leur suivi en direct et l'installation pas à pas, le canal
 * de Bosco et le seuil d'inactivité. Sur le téléphone, c'est la racine des Réglages.
 */
export function SourcesScreen() {
  const now = useNow(STATUS_REFRESH_MS);
  // Sur le téléphone, les réglages se lisent seulement : ils se modifient depuis le poste
  const phone = useIsPhone();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data } = useQuery(sourcesQuery);
  const sources = data?.sources ?? [];
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const [chosen, setSelected] = useState<null | SourceDto>(null);
  // « ?suivi=<source> » (depuis le détail d'une session) : le panneau s'ouvre sur le suivi en direct de ce profil
  const [trackingDismissed, setTrackingDismissed] = useState(false);
  const trackingLink = useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(globalThis.location.search).get('suivi'),
    () => null,
  );
  const linkedSource = sources.find((source) => source.id === trackingLink && !source.managed) ?? null;
  const selected = chosen ?? (trackingDismissed ? null : linkedSource);
  const [step, setStep] = useState<LiveTrackingStep>('intro');
  // La source des bacs à sable n'a pas de suivi en direct à installer : son état ne se lit pas
  const statuses = useQueries({
    queries: sources.map((source) => ({
      enabled: !source.managed,
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
      setTrackingDismissed(true);
      push('Suivi en direct retiré : les réglages d’avant sont remis.', 'info');
    },
  });
  const saveSettings = useMutation({
    mutationFn: (changes: Partial<SettingsDto>) => updateSettings(changes),
    onSuccess: (saved) => client.setQueryData(settingsQuery.queryKey, saved),
    onError: () => push('Le réglage n’a pas pu être enregistré.', 'warning'),
  });
  // Canal de Bosco : son installation par profil ; « ?canal=1 » (depuis la bande d'une session du terminal) ouvre le panneau
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
  const androidApp = useAndroidApp();
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
  const [adding, setAdding] = useState(false);
  const add = useMutation({
    mutationFn: addSource,
    onSuccess: async (source) => {
      await refresh();
      setAdding(false);
      push(`Dossier ajouté : ${source.label} est surveillé.`, 'success');
    },
  });
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
      <SettingsHeader current="sources" />
      <p className="text-xs text-muted">Poste local · lecture seule, rien n’est modifié sans ton accord</p>
      <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
        Le suivi en direct s’installe depuis le poste : ouvre {APP_NAME} sur l’ordinateur, dans Réglages › Sources, pour
        l’installer ou le retirer.
      </p>
      <div className="hidden items-center md:flex">
        <p className="text-sm text-muted">Les dossiers de configuration que {APP_NAME} lit.</p>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => {
            add.reset();
            setAdding(true);
          }}
        >
          <FolderPlus aria-hidden className="size-4" />
          Ajouter un dossier
        </Button>
      </div>
      <section aria-labelledby="sources-title" className="rounded-card border border-line bg-surface shadow-card">
        <h2 id="sources-title" className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
          {watchedCount > 1 ? `${watchedCount} sources surveillées` : `${watchedCount} source surveillée`}
        </h2>
        <ul className="divide-y divide-line">
          {sources.map((source) => {
            if (source.managed)
              return (
                <ManagedSourceCard
                  key={source.id}
                  path={displayPath(source.path, data.home)}
                  activity={sandboxActivity((sessions ?? []).filter((session) => session.sourceId === source.id))}
                />
              );
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
                manageHref={`/settings/sources/${encodeURIComponent(source.id)}`}
                path={displayPath(source.path, data.home)}
                liveTracking={source.liveTracking}
                liveTrackingOutdated={statusOf(source.id)?.outdated}
                watched={source.watched}
                readOnly={phone}
                onWatchedChange={(watched) => switchSource.mutate({ id: source.id, watched })}
                lastSignalAt={signal ? new Date(signal) : null}
                now={now}
                onOpenLiveTracking={() => {
                  setSelected(source);
                  setStep(firstStep(source.liveTracking, statusOf(source.id)?.outdated ?? false));
                }}
              />
            );
          })}
        </ul>
      </section>
      <p className="flex items-center gap-3 rounded-card border border-dashed border-line-strong px-3 py-2 text-xs text-muted md:hidden">
        <Monitor aria-hidden className="size-4 shrink-0" />
        Pour ajouter un dossier, ouvre {APP_NAME} sur le poste.
      </p>
      {settings && (
        <SettingsPanel
          settings={settings}
          readOnly={phone}
          busy={saveSettings.isPending}
          onChange={(changes) => saveSettings.mutate(changes)}
        />
      )}
      {androidApp && (
        // Réglages propres à l'application Android : poste appairé, arrière-plan
        <button
          type="button"
          className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-left shadow-card md:hidden"
          onClick={() => postToAndroidApp({ type: 'app-settings' })}
        >
          <span className="font-medium">Réglages de l’application</span>
          <ChevronRight aria-hidden className="size-4 text-muted" />
        </button>
      )}
      <AddFolderDialog
        open={adding}
        busy={add.isPending}
        serverError={add.error ? refusalOf(add.error) : null}
        onCancel={() => setAdding(false)}
        onSubmit={(path) => add.mutate(path)}
      />
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
        onClose={() => {
          setSelected(null);
          setTrackingDismissed(true);
        }}
        onInstall={(backup) => selected && install.mutate({ backup, id: selected.id })}
        onUninstall={() => selected && uninstall.mutate(selected.id)}
      />
    </div>
  );
}
