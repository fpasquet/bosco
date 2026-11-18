'use client';
import { Box, Database, SquareTerminal, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { useContainerActions } from '../../hooks/use-container-actions';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { coresOf, memoryOf, memoryUsageOf, nearCeiling, timeOf } from '../../lib/containers';

/**
 * Conteneurs en cours sur le téléphone : le total en tête, puis une carte par bac à sable (avec ses services de données)
 * et par tour piloté sur le poste.
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
      {!frozen && !empty && (
        <p className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 font-mono text-xs">
          <span>
            CPU <b className="font-medium">{coresOf({ cpu: view.totals.cpu, cpuLimit: null }).split(' ')[0]}</b> cœur
            sur {view.hostCpus}
          </span>
          <span className="ml-auto">
            Mémoire <b className="font-medium">{memoryOf(view.totals.memory)}</b>
          </span>
        </p>
      )}
      {view.sandboxes.length > 0 && !frozen && (
        <h2 className="mt-1 text-xs font-semibold tracking-wider text-muted uppercase">Bacs à sable</h2>
      )}
      {view.sandboxes.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {view.sandboxes.map((sandbox) => {
            const near = nearCeiling(sandbox);
            return (
              <li key={sandbox.name} className="rounded-card border border-line bg-surface px-3 py-2.5">
                <p className="flex items-center gap-2">
                  <Box aria-hidden className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate font-medium">{sandbox.title}</span>
                </p>
                <p className="mt-0.5 pl-6 font-mono text-xs text-muted">
                  {[sandbox.project, sandbox.since ? `depuis ${timeOf(sandbox.since)}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p
                  className={near.cpu || near.memory ? 'mt-2 font-mono text-xs text-warning' : 'mt-2 font-mono text-xs'}
                >
                  CPU {coresOf(sandbox)} · {memoryUsageOf(sandbox)}
                  {(near.cpu || near.memory) && ' · Proche du plafond'}
                </p>
                {sandbox.services.length > 0 && (
                  <ul aria-label="Services de données" className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
                    {sandbox.services.map((service) => (
                      <li key={service.name} className="flex items-center gap-2 font-mono text-xs">
                        <Database aria-hidden className="size-3.5 shrink-0 text-muted" />
                        <span>{service.name}</span>
                        <span className="min-w-0 flex-1 truncate text-muted">{service.image}</span>
                        <span className={service.state === 'failed' ? 'text-danger' : 'text-muted'}>
                          {service.state === 'failed' ? 'En échec' : memoryUsageOf(service)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Dernières mesures d'un Docker muet : leurs actions sont désactivées */}
                {sandbox.sessionId &&
                  (frozen ? (
                    <Button variant="outline" className="mt-2 h-11 w-full" disabled>
                      Voir la session
                    </Button>
                  ) : (
                    <Button variant="outline" className="mt-2 h-11 w-full" asChild>
                      <Link href={`/sessions/${sandbox.sessionId}`}>Voir la session</Link>
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
      {view.piloted.length > 0 && (
        <h2 className="mt-1 text-xs font-semibold tracking-wider text-muted uppercase">Tours sur le poste</h2>
      )}
      {view.piloted.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {view.piloted.map((turn) => (
            <li key={turn.sessionId} className="rounded-card border border-line bg-surface px-3 py-2.5">
              <p className="flex items-center gap-2">
                <SquareTerminal aria-hidden className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate font-medium">{turn.title}</span>
              </p>
              <p className="mt-0.5 pl-6 font-mono text-xs text-muted">
                tour depuis {timeOf(turn.since)} · {coresOf(turn)} · {memoryOf(turn.memory)}
              </p>
              <Button variant="outline" className="mt-2 h-11 w-full" onClick={() => actions.interrupt(turn.sessionId)}>
                Arrêter le tour
              </Button>
              <Button variant="ghost" className="mt-1 h-11 w-full text-muted" asChild>
                <Link href={`/sessions/${turn.sessionId}`}>Voir la session</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
      {empty && !frozen && <p className="text-muted">Rien ne tourne en ce moment.</p>}
    </div>
  );
}
