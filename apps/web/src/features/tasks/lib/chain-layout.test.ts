import { describe, expect, it } from 'vitest';
import { STORY_TASKS } from '../fixtures';
import { CHAIN_NODE, chainAround, layoutChain } from './chain-layout';
import { chainOf } from './tasks';

const chain = chainOf(STORY_TASKS);

describe('layoutChain', () => {
  it('draws one arrow per prerequisite, T-15 receiving two (CA-TACH-73)', () => {
    const { edges } = layoutChain(chain);
    expect(new Set(edges.map(({ source, target }) => `${source}->${target}`))).toEqual(
      new Set(['12->13', '13->15', '14->15']),
    );
  });

  it('measures the drawing, so the frame takes its height', () => {
    const { nodes, size } = layoutChain(chain);
    for (const { x, y } of nodes) {
      expect(x + CHAIN_NODE.width).toBeLessThanOrEqual(size.width);
      expect(y + CHAIN_NODE.height).toBeLessThanOrEqual(size.height);
    }
    expect(size.height).toBe(Math.max(...nodes.map(({ y }) => y + CHAIN_NODE.height)));
  });

  it('marks the arrow of a same-repository prerequisite not merged yet (CA-TACH-73)', () => {
    const { edges } = layoutChain(chain);
    expect(edges.filter((edge) => edge.sameBranch).map((edge) => edge.id)).toEqual(['12-13']);
  });

  it('places each task below its prerequisites, without overlap (CA-TACH-73)', () => {
    const { edges, nodes } = layoutChain(chain);
    const at = new Map(nodes.map((node) => [node.task.id, node]));
    for (const edge of edges)
      expect(at.get(edge.target)!.y).toBeGreaterThan(at.get(edge.source)!.y + CHAIN_NODE.height);
    for (const a of nodes)
      for (const b of nodes) {
        if (a === b) continue;
        const apart = Math.abs(a.x - b.x) >= CHAIN_NODE.width || Math.abs(a.y - b.y) >= CHAIN_NODE.height;
        expect(apart).toBe(true);
      }
  });

  it('ignores a prerequisite that is not drawn', () => {
    const { edges } = layoutChain(chain.filter((task) => task.id !== 12));
    expect(edges.some((edge) => edge.source === 12)).toBe(false);
  });
});

describe('chainAround', () => {
  it('returns the tasks upstream and downstream of a task (CA-TACH-10)', () => {
    const { edges } = layoutChain(chain);
    expect(chainAround(13, edges)).toEqual(new Set([12, 13, 15]));
    expect(chainAround(14, edges)).toEqual(new Set([14, 15]));
  });
});
