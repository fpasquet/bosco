'use client';
import { Bot, Database } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { coresOf, memoryUsageOf, nearCeiling } from '../../lib/containers';

/**
 * Ressources d'une tâche du worker en cours (E13d, CA-TACH-79, CA-TACH-80) : processeur et mémoire de son agent,
 * mémoire de chaque service de test, rapportés à leur plafond et mis à jour toutes les 5 s. Le bloc disparaît quand ses
 * conteneurs sont supprimés ; le journal garde alors leur pic de mémoire.
 */
export function TaskResources({ taskId }: { taskId: number }) {
  const view = useLiveContainers();
  const { setOpen } = useContainersPanel();
  const agent = view?.agents.find((candidate) => candidate.taskId === taskId);
  if (!agent) return null;
  const near = nearCeiling(agent);
  return (
    <section aria-labelledby="resources-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <h2 id="resources-title" className="text-xs font-semibold text-muted">
          Ressources
        </h2>
        <Button variant="ghost" size="xs" className="ml-auto hidden md:inline-flex" onClick={() => setOpen(true)}>
          Tous les conteneurs
        </Button>
        <Button variant="ghost" size="xs" className="ml-auto md:hidden" asChild>
          <Link href="/tasks/containers">Tous les conteneurs</Link>
        </Button>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-2">
          <Bot aria-hidden className="size-4 text-muted" />
          Agent
        </span>
        <span className={cn('font-mono text-xs', near.cpu && 'text-warning')}>{coresOf(agent)}</span>
        <span className={cn('font-mono text-xs', near.memory && 'text-warning')}>{memoryUsageOf(agent)}</span>
        {(near.cpu || near.memory) && <span className="text-xs text-warning">Proche du plafond</span>}
      </p>
      {agent.services.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-2 text-sm">
          {agent.services.map((service) => (
            <li key={service.name} className="flex items-center gap-2">
              <Database aria-hidden className="size-4 text-muted" />
              {service.service}
              <span className={cn('font-mono text-xs', nearCeiling(service).memory ? 'text-warning' : 'text-muted')}>
                {service.state === 'running' ? memoryUsageOf(service) : 'Redémarrage…'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
