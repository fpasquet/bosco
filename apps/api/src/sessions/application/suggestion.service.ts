import { basename } from 'node:path';
import type { SessionRepository, SourceRepository } from './ports.ts';
import { PilotTargetNotFound } from '../domain/pilot.ts';

/** Suggestion de l'éditeur (E2h) : un fichier, ou une commande et son origine. */
export interface Suggestion {
  description: null | string;
  origin: null | string;
  value: string;
}

export interface Suggestions {
  commandsOf(
    profile: { label: string; path: string },
    repository: { name: string; root: string },
    query: string,
  ): Promise<Suggestion[]>;
  filesOf(cwd: string, query: string): Promise<Suggestion[]>;
}

/** Où chercher : une session, ou le dépôt et le profil d'une nouvelle session (E16a). */
export type SuggestionTarget = { profile: null | string; repository: string } | { sessionId: string };

/** Suggestions de « @ » et de « / » dans l'éditeur (CA-SESS-99). */
export class SuggestionService {
  constructor(
    private readonly suggestions: Suggestions,
    private readonly sessionRepository: Pick<SessionRepository, 'find'>,
    private readonly sources: Pick<SourceRepository, 'list'>,
  ) {}

  async suggest(kind: 'command' | 'file', target: SuggestionTarget, query: string): Promise<Suggestion[]> {
    const place = await this.placeOf(target);
    if (kind === 'file') return this.suggestions.filesOf(place.cwd, query);
    if (!place.profile) return [];
    return this.suggestions.commandsOf(place.profile, { name: basename(place.root), root: place.root }, query);
  }

  private async placeOf(
    target: SuggestionTarget,
  ): Promise<{ cwd: string; profile: null | { label: string; path: string }; root: string }> {
    const sources = await this.sources.list();
    if ('sessionId' in target) {
      const session = await this.sessionRepository.find(target.sessionId);
      const snapshot = session?.toSnapshot();
      const cwd = snapshot?.repoPath ?? snapshot?.repoRoot;
      if (!snapshot || !cwd) throw new PilotTargetNotFound(`Bosco ne connaît pas la session ${target.sessionId}.`);
      const source = sources.find(({ id }) => id === snapshot.sourceId);
      return {
        cwd,
        profile: source ? { label: source.label, path: source.path } : null,
        root: snapshot.repoRoot ?? cwd,
      };
    }
    const source = sources.find(({ path }) => path === target.profile);
    return {
      cwd: target.repository,
      profile: source ? { label: source.label, path: source.path } : null,
      root: target.repository,
    };
  }
}
