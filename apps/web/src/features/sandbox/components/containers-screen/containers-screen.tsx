'use client';
import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { useContainerActions } from '../../hooks/use-container-actions';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { coresOf, memoryOf, memoryUsageOf, nearCeiling, timeOf } from '../../lib/containers';

/**
 * Conteneurs en cours sur le téléphone : une carte par bac à sable et par tour piloté sur le poste.
 * Arrêter un tour s'y fait ; un bac à sable s'arrête depuis sa session.
 */
export function ContainersScreen() {
  const view = useLiveContainers();
  const actions = useContainerActions();
  if (!view) return <PageSkeleton variant="list" rows={3} />;
  const frozen = view.unreachableSince !== null;
  const empty = view.sandboxes.length === 0 && view.piloted.length === 0;
  return (
    <div className="flex flex-col gap-3 p-3">
      {frozen && view.unreachableSince && (
        <div role="alert" className="rounded-control border border-warning bg-warning-soft px-3 py-2.5">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning" />
            Docker ne répond pas depuis {timeOf(view.unreachableSince)}
          </p>
          <p className="mt-1 text-xs text-muted">Ni mesure, ni nouveau bac à sable.</p>
          <Button variant="outline" className="mt-2 h-11 w-full" disabled={actions.retrying} onClick={actions.retry}>
            Réessayer
          </Button>
        </div>
      )}
      {frozen && view.measuredAt && (
        <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
          Dernières mesures · {timeOf(view.measuredAt)}
        </h2>
      )}
      {view.sandboxes.length > 0 && !frozen && (
        <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Bacs à sable</h2>
      )}
      <ul className="flex flex-col gap-2.5">
        {view.sandboxes.map((sandbox) => {
          const near = nearCeiling(sandbox);
          return (
            <li key={sandbox.name} className="rounded-card border border-line bg-surface px-3 py-2.5">
              <p className="truncate font-medium">{sandbox.title}</p>
              <p
                className={
                  near.cpu || near.memory ? 'mt-1 font-mono text-xs text-warning' : 'mt-1 font-mono text-xs text-muted'
                }
              >
                CPU {coresOf(sandbox)} · {memoryUsageOf(sandbox)}
                {(near.cpu || near.memory) && ' · Proche du plafond'}
              </p>
              {sandbox.sessionId && (
                <Button variant="outline" className="mt-2 h-11 w-full" asChild>
                  <Link href={`/sessions/${sandbox.sessionId}`}>Voir la session</Link>
                </Button>
              )}
            </li>
          );
        })}
        {view.piloted.map((turn) => (
          <li key={turn.sessionId} className="rounded-card border border-line bg-surface px-3 py-2.5">
            <p className="truncate font-medium">{turn.title}</p>
            <p className="mt-1 font-mono text-xs text-muted">
              Tour depuis {timeOf(turn.since)} · CPU {coresOf(turn)} · {memoryOf(turn.memory)}
            </p>
            <Button variant="outline" className="mt-2 h-11 w-full" onClick={() => actions.interrupt(turn.sessionId)}>
              Arrêter le tour
            </Button>
          </li>
        ))}
      </ul>
      {empty && !frozen && <p className="text-muted">Rien ne tourne en ce moment.</p>}
    </div>
  );
}
