'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react';
import Link from 'next/link';
import { useMemo } from 'react';
import type { TaskDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { CHAIN_NODE, chainAround, layoutChain } from '../../lib/chain-layout';
import { TaskStateBadge } from '../task-state-badge';

type TaskNode = Node<{ lit: boolean; task: TaskDto }, 'task'>;

/** Une tâche du dessin : un lien vers son détail (CA-TACH-75), comme une ligne de la liste. */
function TaskNodeCard({ data: { lit, task } }: NodeProps<TaskNode>) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 rounded-control border border-line-strong bg-surface px-2.5 py-2 text-xs shadow-card',
        task.state === 'to_review' && 'border-primary bg-primary-soft',
        task.state === 'awaiting_session' && 'border-warning bg-warning-soft',
        lit && 'ring-2 ring-primary',
      )}
      style={{ height: CHAIN_NODE.height, width: CHAIN_NODE.width }}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="flex items-center gap-1.5">
        <span className="shrink-0 font-mono text-muted">T-{task.id}</span>
        <TaskStateBadge state={task.state} />
      </span>
      <Link href={`/tasks/${task.id}`} className="truncate font-medium text-ink after:absolute after:inset-0">
        {task.title}
      </Link>
      <span className="truncate font-mono text-muted">{task.repository.name}</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

const NODE_TYPES = { task: TaskNodeCard };

const LABELS = {
  'controls.ariaLabel': "Commandes de l'enchaînement",
  'controls.fitView.ariaLabel': 'Recentrer',
  'controls.zoomIn.ariaLabel': 'Zoomer',
  'controls.zoomOut.ariaLabel': 'Dézoomer',
};

/**
 * Enchaînement des tâches actives liées (E5b, E5c, DT-34) : une flèche de chaque préalable vers la tâche qui l'attend,
 * tâches rangées de haut en bas ; le dessin se déplace, se zoome et se recentre, les tâches restent à leur place. Le
 * survol d'une ligne de la liste (`highlighted`) entoure sa chaîne et colore ses flèches. Pas de dessin sur téléphone : les puces
 * « Attend » de chaque carte le remplacent.
 */
export function TaskChain({ highlighted = null, tasks }: { highlighted?: null | number; tasks: TaskDto[] }) {
  const phone = useIsPhone();
  const { edges, nodes } = useMemo(() => layoutChain(tasks), [tasks]);
  const lit = useMemo(
    () =>
      highlighted !== null && nodes.some(({ task }) => task.id === highlighted)
        ? chainAround(highlighted, edges)
        : null,
    [edges, highlighted, nodes],
  );

  const flowNodes = useMemo<TaskNode[]>(
    () =>
      nodes.map(({ task, x, y }) => ({
        data: { lit: lit?.has(task.id) ?? false, task },
        id: String(task.id),
        position: { x, y },
        type: 'task',
      })),
    [lit, nodes],
  );
  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => {
        const onChain = lit?.has(edge.source) === true && lit.has(edge.target);
        return {
          className: cn(onChain && 'is-lit'),
          id: edge.id,
          label: edge.sameBranch ? 'même branche' : undefined,
          markerEnd: {
            color: onChain ? 'var(--color-primary)' : 'var(--color-line-strong)',
            height: 16,
            type: MarkerType.ArrowClosed,
            width: 16,
          },
          source: String(edge.source),
          target: String(edge.target),
        };
      }),
    [edges, lit],
  );

  if (tasks.length === 0 || phone) return null;
  return (
    <aside
      aria-labelledby="chain-title"
      className="flex flex-col rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 id="chain-title" className="text-xs font-semibold text-muted">
        Enchaînement
      </h2>
      <p className="mb-3 text-xs text-muted">Une tâche part quand toutes ses flèches entrantes sont validées.</p>
      <div className="task-chain h-96 overflow-hidden rounded-control border border-line bg-surface-alt">
        <ReactFlow
          key={nodes.map(({ task }) => task.id).join(',')}
          ariaLabelConfig={LABELS}
          edges={flowEdges}
          edgesFocusable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ maxZoom: 1, padding: 0.12 }}
          maxZoom={1.5}
          minZoom={0.3}
          nodes={flowNodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodesFocusable={false}
          nodeTypes={NODE_TYPES}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} variant={BackgroundVariant.Dots} />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </div>
    </aside>
  );
}
