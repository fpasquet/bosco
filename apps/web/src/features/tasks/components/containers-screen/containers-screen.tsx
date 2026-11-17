'use client';
import { TriangleAlert } from 'lucide-react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { coresOf, memoryOf, memoryUsageOf, nearCeiling, timeOf } from '../../lib/containers';
import { useContainerActions } from '../containers-dialogs';

/**
 * Conteneurs en cours sur le téléphone (E19a, E19c, E19d) : écran poussé depuis la ligne du worker, une carte par
 * élément. Arrêter un agent ou un tour et redémarrer un service s'y font ; « Journal » et « Voir la tâche » restent
 * sur le poste.
 */
export function ContainersScreen() {
  const view = useLiveContainers();
  const actions = useContainerActions();
  if (!view) return <PageSkeleton variant="list" rows={3} />;
  const frozen = view.unreachableSince !== null;
  const empty = view.agents.length === 0 && view.piloted.length === 0 && view.leftovers.length === 0;
  return (
    <div className="flex flex-col gap-3 p-3">
      {frozen && view.unreachableSince && (
        <div role="alert" className="rounded-control border border-warning bg-warning-soft px-3 py-2.5">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning" />
            Docker ne répond pas depuis {timeOf(view.unreachableSince)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Ni mesure, ni arrêt, ni redémarrage ; le worker ne lance plus de tâche.
          </p>
          <Button variant="outline" className="mt-2 h-11 w-full" disabled={actions.retrying} onClick={actions.retry}>
            Réessayer
          </Button>
        </div>
      )}
      {!frozen && view.leftovers.length > 0 && (
        <section aria-labelledby="leftovers-mobile" className="rounded-card border border-line bg-surface-alt">
          <div className="border-b border-line px-3 py-2.5">
            <h2 id="leftovers-mobile" className="text-xs font-semibold tracking-wider text-muted uppercase">
              Restés après leur tâche
            </h2>
            {view.nextCleanupAt && (
              <p className="mt-0.5 text-xs text-muted">Suppression automatique à {timeOf(view.nextCleanupAt)}</p>
            )}
          </div>
          <ul className="divide-y divide-line text-sm">
            {view.leftovers.map((leftover) => (
              <li key={leftover.name} className="px-3 py-2.5">
                <span className="mr-1 font-mono text-xs text-muted">T-{leftover.taskId}</span>
                {leftover.kind === 'service' ? `${leftover.service ?? ''} · service` : 'agent'} ·{' '}
                {leftover.running ? 'en marche' : 'arrêté'}
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-3">
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={actions.removing}
              onClick={() => actions.remove()}
            >
              Tout supprimer maintenant
            </Button>
          </div>
          <p className="border-t border-line px-3 py-2 text-xs text-muted">
            Ni processeur ni mémoire : {memoryOf(view.leftoversDisk)} sur le disque.
          </p>
        </section>
      )}
      {frozen && view.measuredAt && (
        <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
          Dernières mesures · {timeOf(view.measuredAt)}
        </h2>
      )}
      {view.agents.length > 0 && !frozen && (
        <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Agents du worker</h2>
      )}
      <ul className="flex flex-col gap-2.5">
        {view.agents.map((agent) => {
          const near = nearCeiling(agent);
          return (
            <li key={agent.name} className="rounded-card border border-line bg-surface px-3 py-2.5">
              <p className="truncate font-medium">
                <span className="mr-1 font-mono text-xs text-muted">T-{agent.taskId}</span>
                {agent.title}
              </p>
              <p
                className={
                  near.cpu || near.memory ? 'mt-1 font-mono text-xs text-warning' : 'mt-1 font-mono text-xs text-muted'
                }
              >
                CPU {coresOf(agent)} · {memoryUsageOf(agent)}
                {(near.cpu || near.memory) && ' · Proche du plafond'}
              </p>
              {agent.services.map((service) => (
                <div key={service.name} className="mt-2 flex items-center gap-2 border-t border-line pt-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {service.service}{' '}
                    <span className="font-mono text-xs text-muted">
                      {service.state === 'running' ? memoryUsageOf(service) : 'Redémarrage…'}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11"
                    disabled={frozen || service.state === 'restarting'}
                    onClick={() => actions.askRestart(agent, service)}
                  >
                    Redémarrer
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="mt-2 h-11 w-full"
                disabled={frozen}
                onClick={() => actions.askStop(agent)}
              >
                Arrêter
              </Button>
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
      {actions.dialogs}
    </div>
  );
}
