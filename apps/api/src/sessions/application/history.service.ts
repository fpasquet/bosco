import type { SessionState } from '../domain/session.ts';
import type { SessionRepository } from './ports.ts';
import type { SessionService, SessionView } from './session.service.ts';

/** Filtres de l'historique : ils se cumulent. */
export interface HistoryFilters {
  /** Sessions commencées depuis cette date ; aucune : tout l'historique */
  from: Date | null;
  /** Groupe : les sessions de tous ses projets, celles qui en voient un comme projet ajouté comprises */
  groupId: null | number;
  query: string;
  project: null | string;
  sourceId: null | string;
  state: null | SessionState;
}

/** Un jour de l'historique, du plus récent au plus ancien, avec son total. */
export interface HistoryDay {
  costUsd: number;
  date: string;
  sessions: SessionView[];
}

/** Jour local d'une date, en AAAA-MM-JJ : les journées suivent l'heure du poste. */
export function dayOf(date: Date): string {
  return date.toLocaleDateString('sv');
}

/** Projets d'une session : le principal, puis ceux qu'elle voit en plus. */
function projectsOf(session: SessionView): number[] {
  return [session.project?.id, ...session.addedProjects.map(({ id }) => id)].filter(
    (id): id is number => typeof id === 'number',
  );
}

function sum<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

/** Cas d'usage de l'historique ; les coûts sont des estimations, l'usage a sa page. */
export class HistoryService {
  constructor(
    private readonly sessionService: Pick<SessionService, 'knownGroups' | 'listSessions'>,
    private readonly sessionRepository: Pick<SessionRepository, 'search'>,
  ) {}

  async history(filters: HistoryFilters): Promise<HistoryDay[]> {
    const sessions = await this.filtered(filters);
    const days = new Map<string, SessionView[]>();
    for (const session of sessions.toSorted((a, b) => b.startedAt.getTime() - a.startedAt.getTime())) {
      const day = dayOf(session.startedAt);
      days.set(day, [...(days.get(day) ?? []), session]);
    }
    return [...days.entries()].map(([date, daySessions]) => ({
      date,
      sessions: daySessions,
      costUsd: sum(daySessions, (session) => session.cost.usd),
    }));
  }

  private async filtered(filters: HistoryFilters): Promise<SessionView[]> {
    const sessions = await this.sessionService.listSessions();
    const found = filters.query.trim() ? await this.sessionRepository.search(filters.query) : null;
    const groups = filters.groupId === null ? [] : await this.sessionService.knownGroups();
    const group = filters.groupId === null ? null : new Set(groups.find(({ id }) => id === filters.groupId)?.projects);
    return sessions.filter(
      (session) =>
        (!filters.from || session.startedAt >= filters.from) &&
        (!group || projectsOf(session).some((id) => group.has(id))) &&
        (!filters.project || session.project?.name === filters.project) &&
        (!filters.sourceId || session.sourceId === filters.sourceId) &&
        (!filters.state || session.state === filters.state) &&
        (!found || found.has(session.id)),
    );
  }
}
