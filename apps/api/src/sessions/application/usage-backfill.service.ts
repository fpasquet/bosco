import type { SourceRepository, TranscriptReplay, UsageBackfillRepository } from './ports.ts';

/**
 * Usage des sessions lues avant la page Usage : leurs transcripts sont relus une fois, en arrière-plan, pour garder
 * l'usage de chaque tour et les PR créées ; une session dont le transcript a disparu compte au jour de son début.
 */
export class UsageBackfillService {
  constructor(
    private readonly repository: UsageBackfillRepository,
    private readonly sources: Pick<SourceRepository, 'list'>,
    private readonly replay: TranscriptReplay,
  ) {}

  async completeUsage(): Promise<number> {
    const sessions = await this.repository.listIncompleteUsage();
    const sources = await this.sources.list();
    for (const session of sessions) {
      const { id, sourceId } = session.toSnapshot();
      const source = sources.find((candidate) => candidate.id === sourceId);
      const events = source ? await this.replay.read(source.path, id) : null;
      session.replayUsage(events);
      await this.repository.replaceUsage(session);
    }
    return sessions.length;
  }
}
