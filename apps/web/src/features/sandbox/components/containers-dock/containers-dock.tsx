'use client';
import { Box, ChevronDown, Database, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import type { ContainersDto, RunningServiceDto, UsageDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { useContainerActions } from '../../hooks/use-container-actions';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { agoOf, coresOf, countsOf, memoryOf, nearCeiling, somethingRuns, timeOf } from '../../lib/containers';
import { UsageGauge } from './usage-gauge';

/** « Proche du plafond » sous un élément à 80 % ou plus de son processeur ou de sa mémoire */
function NearCeiling({ frozen, usage }: { frozen: boolean; usage: UsageDto }) {
  const near = nearCeiling(usage);
  if (frozen || (!near.cpu && !near.memory)) return null;
  return <span className="text-warning"> · Proche du plafond</span>;
}

function GroupRow({ children }: { children: string }) {
  return (
    <tr>
      <th colSpan={5} scope="colgroup" className="pt-3 pb-1 text-left">
        <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">{children}</h3>
      </th>
    </tr>
  );
}

const SERVICE_STATES = {
  ready: { badge: 'badge-success', label: 'Prêt' },
  starting: { badge: 'badge-info', label: 'Démarre' },
  failed: { badge: 'badge-error', label: 'En échec' },
} as const;

/** Un service de données sous son bac à sable : son nom (celui que l'agent joint), son image et son état. */
function ServiceRow({ frozen, service }: { frozen: boolean; service: RunningServiceDto }) {
  const state = SERVICE_STATES[service.state];
  return (
    <tr className="border-b border-line">
      <td className="py-2 pl-6">
        <p className="flex items-center gap-2 truncate">
          <Database aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="font-mono text-xs">{service.name}</span>
          <span className={`badge badge-soft badge-sm ${state.badge}`}>{state.label}</span>
        </p>
        <p className="mt-0.5 truncate pl-6 font-mono text-xs text-muted">
          {service.image} · service de données
          <NearCeiling frozen={frozen} usage={service} />
        </p>
      </td>
      <td className="py-2 font-mono text-xs">{service.since ? timeOf(service.since) : ''}</td>
      <td className="py-2">
        {service.state === 'failed' ? null : <UsageGauge frozen={frozen} kind="cpu" usage={service} />}
      </td>
      <td className="py-2">
        {service.state === 'failed' ? null : <UsageGauge frozen={frozen} kind="memory" usage={service} />}
      </td>
      <td className="py-2 pr-0" />
    </tr>
  );
}

/** Le corps du panneau : panne de Docker, puis bacs à sable (et leurs services) et tours pilotés sur le poste. */
function DockBody({ actions, view }: { actions: ReturnType<typeof useContainerActions>; view: ContainersDto }) {
  const frozen = view.unreachableSince !== null;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
      {frozen && view.unreachableSince && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-control border border-warning bg-warning-soft px-4 py-3"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Docker ne répond pas depuis {timeOf(view.unreachableSince)}.</p>
            <p className="mt-0.5 text-xs text-muted">
              Bosco ne peut plus mesurer les bacs à sable, ni en démarrer. Ceux déjà lancés continuent peut-être de
              travailler.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={actions.retrying} onClick={actions.retry}>
            Réessayer
          </Button>
        </div>
      )}
      <table className={cn('table w-full table-fixed border-collapse text-left', frozen && 'text-muted')}>
        <thead className="text-xs text-muted">
          <tr className="h-8 border-b border-line">
            <th className="font-medium">Élément</th>
            <th className="w-24 font-medium">Depuis</th>
            <th className="w-48 font-medium">CPU</th>
            <th className="w-48 font-medium">Mémoire</th>
            <th className="w-56 pr-0 text-right font-medium">Actions</th>
          </tr>
        </thead>
        {view.sandboxes.length > 0 && (
          <tbody>
            <GroupRow>
              {frozen && view.measuredAt ? `Dernières mesures · ${timeOf(view.measuredAt)}` : 'Bacs à sable'}
            </GroupRow>
            {view.sandboxes.map((sandbox) => (
              <Fragment key={sandbox.name}>
                <tr className="border-b border-line">
                  <td className="py-2">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <Box aria-hidden className="size-4 shrink-0 text-muted" />
                      <span className="truncate">{sandbox.title}</span>
                    </p>
                    <p className="mt-0.5 truncate pl-6 font-mono text-xs text-muted">
                      {[sandbox.project, 'bac à sable'].filter(Boolean).join(' · ')}
                      <NearCeiling frozen={frozen} usage={sandbox} />
                    </p>
                  </td>
                  <td className="py-2 font-mono text-xs">{sandbox.since ? timeOf(sandbox.since) : ''}</td>
                  <td className="py-2">
                    <UsageGauge frozen={frozen} kind="cpu" usage={sandbox} />
                  </td>
                  <td className="py-2">
                    <UsageGauge frozen={frozen} kind="memory" usage={sandbox} />
                  </td>
                  <td className="py-2 pr-0 text-right">
                    {/* Dernières mesures d'un Docker muet : leurs actions sont désactivées */}
                    {sandbox.sessionId &&
                      (frozen ? (
                        <Button variant="outline" size="xs" disabled>
                          Voir la session
                        </Button>
                      ) : (
                        <Button variant="outline" size="xs" asChild>
                          <Link href={`/sessions/${sandbox.sessionId}`}>Voir la session</Link>
                        </Button>
                      ))}
                  </td>
                </tr>
                {sandbox.services.map((service) => (
                  <ServiceRow key={service.name} frozen={frozen} service={service} />
                ))}
              </Fragment>
            ))}
          </tbody>
        )}
        {view.piloted.length > 0 && (
          <tbody>
            <GroupRow>Tours sur le poste</GroupRow>
            {view.piloted.map((turn) => (
              <tr key={turn.sessionId} className="border-b border-line">
                <td className="py-2">
                  <p className="flex items-center gap-2 truncate font-medium">
                    <SquareTerminal aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="truncate">{turn.title}</span>
                  </p>
                  <p className="mt-0.5 pl-6 font-mono text-xs text-muted">tour depuis {timeOf(turn.since)}</p>
                </td>
                <td className="py-2 font-mono text-xs">{timeOf(turn.since)}</td>
                <td className="py-2">
                  <UsageGauge kind="cpu" usage={turn} />
                </td>
                <td className="py-2">
                  <UsageGauge kind="memory" usage={turn} />
                </td>
                <td className="py-2 pr-0 text-right">
                  <span className="inline-flex gap-1">
                    <Button variant="ghost" size="xs" className="text-muted" asChild>
                      <Link href={`/sessions/${turn.sessionId}`}>Voir la session</Link>
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => actions.interrupt(turn.sessionId)}>
                      Arrêter le tour
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {frozen && (
        <p className="mt-3 text-xs text-muted">
          Les mesures reprennent seules dès que Docker répond ; Bosco réessaie toutes les 30 s.
        </p>
      )}
    </div>
  );
}

/** « il y a 2 s », relu chaque seconde */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Panneau des conteneurs en cours, par-dessus le bas de la page, qui reste utilisable : les bacs à sable
 * démarrés avec leurs services de données, et les tours pilotés sur le poste. Il s'ouvre depuis le résumé de la barre latérale, et reste déplié d'une
 * page à l'autre ; un bac à sable s'arrête depuis sa session.
 */
export function ContainersDock() {
  const view = useLiveContainers();
  const { open, setOpen } = useContainersPanel();
  const actions = useContainerActions();
  const now = useNow();
  if (!open || !view) return null;
  const frozen = view.unreachableSince !== null;
  return (
    <section
      aria-labelledby="containers-title"
      className="absolute inset-x-0 bottom-0 z-20 hidden h-2/3 flex-col border-t border-line-strong bg-surface shadow-card md:flex"
    >
      <header className="flex items-center gap-3 border-b border-line px-6 py-3">
        <Box aria-hidden className={cn('size-4', frozen ? 'text-warning' : 'text-primary')} />
        <h2 id="containers-title" className="font-display text-base font-semibold whitespace-nowrap">
          Conteneurs en cours
        </h2>
        {!frozen && (
          <>
            <span className="min-w-0 truncate font-mono text-xs text-muted">{countsOf(view)}</span>
            <span className="ml-auto flex shrink-0 items-center gap-4 font-mono text-xs whitespace-nowrap text-muted">
              <span>
                CPU{' '}
                <b className="font-medium text-ink">
                  {coresOf({ cpu: view.totals.cpu, cpuLimit: null }).split(' ')[0]}
                </b>{' '}
                cœurs sur {view.hostCpus}
              </span>
              <span>
                Mémoire <b className="font-medium text-ink">{memoryOf(view.totals.memory)}</b>
              </span>
              {view.measuredAt && <span>{agoOf(view.measuredAt, now)}</span>}
            </span>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('text-muted', frozen && 'ml-auto')}
          onClick={() => setOpen(false)}
        >
          <ChevronDown aria-hidden className="size-4" />
          Replier
        </Button>
      </header>
      {somethingRuns(view) ? (
        <DockBody actions={actions} view={view} />
      ) : (
        <p className="px-6 py-4 text-muted">Rien ne tourne en ce moment.</p>
      )}
    </section>
  );
}
