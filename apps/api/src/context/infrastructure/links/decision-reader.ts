import type { ContextService } from '../../application/context.service.ts';
import type { LinkReader } from '../../application/links.service.ts';
import { decisionIdOf } from '../../domain/link.ts';

const STATES: Record<string, string> = {
  proposed: 'Proposée',
  accepted: 'Acceptée',
  refused: 'Refusée',
  replaced: 'Remplacée',
  abandoned: 'Abandonnée',
};

/** Une décision de Bosco, lue dans le contexte : son titre et son état. */
export function decisionReader(context: ContextService): LinkReader {
  return {
    async read(link) {
      const id = decisionIdOf(link.url);
      if (id === null) throw new Error('Décision non reconnue');
      const { decision } = await context.decision(id);
      return {
        title: `DEC-${id} · ${decision.versions.at(-1)?.title ?? ''}`,
        state: STATES[decision.state] ?? null,
        person: null,
      };
    },
  };
}
