'use client';
import { Bot, Box, ChevronDown, Database, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ContainersDto, LeftoverContainerDto, RunningAgentDto, UsageDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { useLiveContainers } from '../../hooks/use-live-containers';
import {
  agoOf,
  coresOf,
  countsOf,
  memoryOf,
  memoryUsageOf,
  nearCeiling,
  somethingRuns,
  timeOf,
} from '../../lib/containers';
import { TASK_STATES } from '../../lib/tasks';
import { useContainerActions } from '../containers-dialogs';

/** Processeur et mémoire d'un élément ; en orange avec « Proche du plafond » à partir de 80 % (CA-CONT-73). */
export function UsageCells({ frozen = false, usage }: { frozen?: boolean; usage: UsageDto }) {
  // Dernières mesures d'un Docker muet : grisées, sans alerte (E19c)
  const near = frozen ? { cpu: false, memory: false } : nearCeiling(usage);
  return (
    <>
      <span className={cn('w-28 text-right font-mono text-xs tabular-nums', near.cpu && 'text-warning')}>
        {coresOf(usage)}
      </span>
      <span className={cn('w-28 text-right font-mono text-xs tabular-nums', near.memory && 'text-warning')}>
        {memoryUsageOf(usage)}
      </span>
      <span className="w-32 text-xs text-warning">{(near.cpu || near.memory) && 'Proche du plafond'}</span>
    </>
  );
}

function GroupTitle({ children }: { children: string }) {
  return <h3 className="pt-4 pb-1 text-xs font-semibold tracking-wider text-muted uppercase">{children}</h3>;
}

/** Une ligne d'agent, puis ses services de test en retrait (E19a). */
function AgentRows({
  actions,
  agent,
  frozen,
}: {
  actions: ReturnType<typeof useContainerActions>;
  agent: RunningAgentDto;
  frozen: boolean;
}) {
  return (
    <li className="border-t border-line">
      <div className="flex h-11 items-center gap-3">
        <Bot aria-hidden className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate font-medium">
          <span className="mr-1.5 font-mono text-xs text-muted">T-{agent.taskId}</span>
          {agent.title}
          <span className="ml-2 font-mono text-xs font-normal text-muted">{agent.repository}</span>
        </span>
        <UsageCells frozen={frozen} usage={agent} />
        <span className="flex w-52 justify-end gap-1">
          <Button variant="ghost" size="xs" asChild>
            <Link href={`/tasks/${agent.taskId}`}>Voir la tâche</Link>
          </Button>
          <Button variant="outline" size="xs" disabled={frozen} onClick={() => actions.askStop(agent)}>
            Arrêter
          </Button>
        </span>
      </div>
      {agent.services.length > 0 && (
        <ul aria-label={`Services de test de T-${agent.taskId}`}>
          {agent.services.map((service) => (
            <li key={service.name} className="flex h-10 items-center gap-3 pl-7 text-sm">
              <Database aria-hidden className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">
                {service.service} <span className="font-mono text-xs text-muted">{service.image}</span>
              </span>
              {service.state === 'running' ? (
                <UsageCells frozen={frozen} usage={service} />
              ) : (
                <span
                  className={cn('w-88 text-right text-xs', service.state === 'failed' ? 'text-danger' : 'text-muted')}
                >
                  {service.state === 'failed' ? 'En échec après redémarrage' : 'Redémarrage…'}
                </span>
              )}
              <span className="flex w-52 justify-end gap-1">
                <Button variant="ghost" size="xs" disabled={frozen} onClick={() => actions.askLogs(service)}>
                  Journal
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={frozen || service.state === 'restarting'}
                  onClick={() => actions.askRestart(agent, service)}
                >
                  Redémarrer
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function leftoverLabel(leftover: LeftoverContainerDto): string {
  if (leftover.kind === 'service') return `${leftover.service ?? leftover.name} · service de T-${leftover.taskId}`;
  return leftover.kind === 'proxy' ? 'proxy de sortie' : 'agent';
}

/** Conteneurs restés après leur tâche (E19d) : en tête, supprimés à l'heure dite ou tout de suite. */
function Leftovers({ actions, view }: { actions: ReturnType<typeof useContainerActions>; view: ContainersDto }) {
  return (
    <section aria-labelledby="leftovers-title" className="mt-4 rounded-card border border-line bg-surface-alt">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <h3 id="leftovers-title" className="text-xs font-semibold tracking-wider text-muted uppercase">
          Restés après leur tâche
        </h3>
        {view.nextCleanupAt && (
          <span className="text-xs text-muted">Suppression automatique à {timeOf(view.nextCleanupAt)}</span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={actions.removing}
          onClick={() => actions.remove()}
        >
          Tout supprimer maintenant
        </Button>
      </div>
      <ul className="divide-y divide-line">
        {view.leftovers.map((leftover) => (
          <li key={leftover.name} className="flex items-center gap-3 px-4 py-2.5">
            {leftover.kind === 'service' ? (
              <Database aria-hidden className="size-4 shrink-0 text-muted" />
            ) : (
              <Bot aria-hidden className="size-4 shrink-0 text-muted" />
            )}
            <span className="min-w-0 flex-1 truncate">
              {leftover.kind !== 'service' && (
                <span className="mr-1.5 font-mono text-xs text-muted">T-{leftover.taskId}</span>
              )}
              {leftover.kind !== 'service' && leftover.task ? `${leftover.task.title} · ` : ''}
              {leftoverLabel(leftover)}
            </span>
            <span className="text-xs text-muted">
              {leftover.task
                ? `tâche ${TASK_STATES[leftover.task.state as keyof typeof TASK_STATES].label} · `
                : 'tâche supprimée · '}
              {leftover.running ? 'en marche' : 'arrêté'}
            </span>
            <Button variant="ghost" size="xs" disabled={actions.removing} onClick={() => actions.remove(leftover.name)}>
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">
        Ils ne consomment ni processeur ni mémoire, seulement de la place sur le disque : {memoryOf(view.leftoversDisk)}
        .
      </p>
    </section>
  );
}

/** Le corps du panneau : panne de Docker, conteneurs restés, puis agents, services et sessions pilotées. */
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
              Bosco ne peut ni mesurer, ni arrêter, ni redémarrer les conteneurs, et le worker ne lance plus de tâche.
              Les agents déjà lancés continuent peut-être de travailler.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={actions.retrying} onClick={actions.retry}>
            Réessayer
          </Button>
        </div>
      )}
      {!frozen && view.leftovers.length > 0 && <Leftovers actions={actions} view={view} />}
      <div className={cn(frozen && 'text-muted')}>
        {frozen && view.measuredAt && <GroupTitle>{`Dernières mesures · ${timeOf(view.measuredAt)}`}</GroupTitle>}
        {view.agents.length > 0 && (
          <>
            {!frozen && <GroupTitle>Agents du worker</GroupTitle>}
            <ul>
              {view.agents.map((agent) => (
                <AgentRows key={agent.name} actions={actions} agent={agent} frozen={frozen} />
              ))}
            </ul>
          </>
        )}
        {view.piloted.length > 0 && (
          <>
            <GroupTitle>Sessions pilotées</GroupTitle>
            <ul>
              {view.piloted.map((turn) => (
                <li key={turn.sessionId} className="flex h-11 items-center gap-3 border-t border-line">
                  <SquareTerminal aria-hidden className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">
                    {turn.title} <span className="text-xs text-muted">· tour depuis {timeOf(turn.since)}</span>
                  </span>
                  <UsageCells usage={turn} />
                  <span className="flex w-52 justify-end">
                    <Button variant="outline" size="xs" onClick={() => actions.interrupt(turn.sessionId)}>
                      Arrêter le tour
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
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
 * Panneau des conteneurs en cours (E19a, E19c, E19d), par-dessus le bas de la page, qui reste utilisable. Il s'ouvre
 * depuis le résumé de la barre latérale ou l'indicateur du worker, et reste déplié d'une page à l'autre.
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
            <span className="min-w-0 truncate font-mono text-xs text-muted">
              {countsOf(view, view.leftovers.length)}
            </span>
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
      {somethingRuns(view) || view.leftovers.length > 0 ? (
        <DockBody actions={actions} view={view} />
      ) : (
        <p className="px-6 py-4 text-muted">Rien ne tourne en ce moment.</p>
      )}
      {!frozen && (
        <footer className="border-t border-line px-6 py-2.5 text-xs text-muted">
          {view.capacity.running} / {view.capacity.maxAgents} agents · {memoryOf(view.capacity.availableMemory)}{' '}
          disponibles au-delà des {memoryOf(view.capacity.reservedMemory)} gardés libres : c’est ce qui décide si la
          prochaine tâche part.
        </footer>
      )}
      {actions.dialogs}
    </section>
  );
}
