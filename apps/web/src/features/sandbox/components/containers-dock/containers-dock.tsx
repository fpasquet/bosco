'use client';
import { Box, ChevronDown, Container, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ContainersDto, UsageDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { useContainerActions } from '../../hooks/use-container-actions';
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

/** Le corps du panneau : panne de Docker, puis bacs à sable et tours pilotés sur le poste. */
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
      <div className={cn(frozen && 'text-muted')}>
        {frozen && view.measuredAt && <GroupTitle>{`Dernières mesures · ${timeOf(view.measuredAt)}`}</GroupTitle>}
        {view.sandboxes.length > 0 && (
          <>
            {!frozen && <GroupTitle>Bacs à sable</GroupTitle>}
            <ul>
              {view.sandboxes.map((sandbox) => (
                <li key={sandbox.name} className="flex h-11 items-center gap-3 border-t border-line">
                  <Container aria-hidden className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate font-medium">{sandbox.title}</span>
                  <UsageCells frozen={frozen} usage={sandbox} />
                  <span className="flex w-52 justify-end">
                    {sandbox.sessionId && (
                      <Button variant="ghost" size="xs" asChild>
                        <Link href={`/sessions/${sandbox.sessionId}`}>Voir la session</Link>
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {view.piloted.length > 0 && (
          <>
            <GroupTitle>Tours sur le poste</GroupTitle>
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
 * Panneau des conteneurs en cours (E19a, E19c), par-dessus le bas de la page, qui reste utilisable : les bacs à sable
 * démarrés et les tours pilotés sur le poste. Il s'ouvre depuis le résumé de la barre latérale, et reste déplié d'une
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
