import { type GraphLabel, graphlib, layout } from '@dagrejs/dagre';
import type { TaskDto } from '@bosco/domain';

/** Taille d'une tâche dans le dessin de l'enchaînement, en pixels du dessin. */
export const CHAIN_NODE = { height: 76, width: 216 } as const;

export interface ChainNode {
  task: TaskDto;
  x: number;
  y: number;
}

export interface ChainEdge {
  id: string;
  /** Préalable du même dépôt dont la tâche partira de la branche (RF-TACH-04) */
  sameBranch: boolean;
  source: number;
  target: number;
}

/**
 * Place l'enchaînement de haut en bas (DT-34) : une flèche de chaque préalable vers la tâche qui l'attend, rangs séparés,
 * sans chevauchement. Les préalables absentes des tâches dessinées sont ignorées. Positions : coin haut gauche.
 */
export function layoutChain(tasks: readonly TaskDto[]): { edges: ChainEdge[]; nodes: ChainNode[] } {
  const ids = new Set(tasks.map((task) => task.id));
  const edges = tasks.flatMap((task) =>
    task.prerequisites
      .filter((id) => ids.has(id))
      .map((id) => ({ id: `${id}-${task.id}`, sameBranch: task.startFrom === id, source: id, target: task.id })),
  );

  const graph = new graphlib.Graph<GraphLabel, { height: number; width: number; x: number; y: number }>();
  graph.setGraph({ marginx: 0, marginy: 0, nodesep: 24, rankdir: 'TB', ranksep: 56 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const task of tasks) graph.setNode(String(task.id), { ...CHAIN_NODE, x: 0, y: 0 });
  for (const edge of edges) graph.setEdge(String(edge.source), String(edge.target));
  layout(graph);

  const nodes = tasks.map((task) => {
    const { x, y } = graph.node(String(task.id));
    return { task, x: x - CHAIN_NODE.width / 2, y: y - CHAIN_NODE.height / 2 };
  });
  return { edges, nodes };
}

/** Tâches liées à une tâche, en amont comme en aval, elle comprise : la chaîne mise en évidence au survol (CA-TACH-10). */
export function chainAround(id: number, edges: readonly ChainEdge[]): Set<number> {
  const linked = new Set([id]);
  const walk = (from: number, next: (edge: ChainEdge) => [number, number]) => {
    for (const edge of edges) {
      const [start, end] = next(edge);
      if (start === from && !linked.has(end)) {
        linked.add(end);
        walk(end, next);
      }
    }
  };
  walk(id, (edge) => [edge.source, edge.target]);
  walk(id, (edge) => [edge.target, edge.source]);
  return linked;
}
