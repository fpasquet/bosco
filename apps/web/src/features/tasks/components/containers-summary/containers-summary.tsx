'use client';
import { Box, PanelBottom, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useContainersPanel } from '../../hooks/use-containers-panel';
import { useLiveContainers } from '../../hooks/use-live-containers';
import { memoryOf, somethingRuns } from '../../lib/containers';

/**
 * « Conteneurs » en bas de la barre latérale (E19a, CA-CONT-70) : seulement si quelque chose tourne, avec le nombre
 * d'agents et la mémoire au total ; en orange quand Docker ne répond pas (CA-CONT-80). Un clic déplie le panneau.
 */
export function ContainersSummary() {
  const view = useLiveContainers();
  const { open, toggle } = useContainersPanel();
  if (!somethingRuns(view) || !view) return null;
  const down = view.unreachableSince !== null;
  const agents = `${view.totals.agents} ${view.totals.agents > 1 ? 'agents' : 'agent'}`;
  return (
    <button
      type="button"
      aria-expanded={open}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-control p-2 text-left text-xs',
        down ? 'border border-warning bg-warning-soft text-ink' : 'hover:bg-nav-active',
      )}
      onClick={toggle}
    >
      {down ? (
        <TriangleAlert aria-hidden className="size-4 shrink-0 text-warning" />
      ) : (
        <Box aria-hidden className="size-4 shrink-0 text-primary" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-nav-ink">Conteneurs</span>
        <span className="block truncate text-nav-muted">
          {down ? 'Docker ne répond pas' : `${agents} · ${memoryOf(view.totals.memory)}`}
        </span>
      </span>
      <PanelBottom aria-hidden className="size-4 shrink-0 text-nav-muted" />
    </button>
  );
}
