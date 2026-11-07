import type { SessionState } from '../domain/session.ts';
import type { SessionRepository } from './ports.ts';
import type { SessionService, SessionView } from './session.service.ts';

/** Filtres de l'historique (E3a) : ils se cumulent (CA-SESS-48). */
export interface HistoryFilters {
  /** Sessions commencées depuis cette date ; aucune : tout l'historique */
  from: Date | null;
  query: string;
  repository: null | string;
  sourceId: null | string;
  state: null | SessionState;
}

/** Un jour de l'historique, du plus récent au plus ancien, avec son total (CA-SESS-49). */
export interface HistoryDay {
  costUsd: number;
  date: string;
  sessions: SessionView[];
}

export interface CostReport {
  /** Moyenne sur les seuls jours ouvrés de la période (CA-SESS-52) */
  averagePerWorkingDayUsd: number;
  byModel: { model: null | string; share: number; usd: number }[];
  byRepository: { name: null | string; sessions: number; share: number; usd: number }[];
  /** Part des tokens lus depuis le cache plutôt que recalculés */
  cacheShare: number;
  /** Un coût par jour ouvré, empilé par dépôt (CA-SESS-53) */
  days: { date: string; repositories: { name: null | string; sessions: number; usd: number }[] }[];
  sessions: number;
  totalUsd: number;
  workingDays: number;
}

/** Jour local d'une date, en AAAA-MM-JJ : les journées suivent l'heure du poste. */
export function dayOf(date: Date): string {
  return date.toLocaleDateString('sv');
}

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/** Jours ouvrés de la période, du plus ancien à aujourd'hui. */
function workingDays(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    if (isWorkingDay(cursor)) days.push(dayOf(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function sum<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function shareOf(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Cas d'usage de l'historique et des coûts (E3a, E3b) ; tous les montants sont des estimations (RF-SESS-05). */
export class HistoryService {
  constructor(
    private readonly sessionService: Pick<SessionService, 'listSessions'>,
    private readonly sessionRepository: Pick<SessionRepository, 'search'>,
    private readonly now: () => Date,
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

  async costs(filters: HistoryFilters): Promise<CostReport> {
    const sessions = await this.filtered(filters);
    const totalUsd = sum(sessions, (session) => session.cost.usd);
    const oldest = sessions.reduce<Date | null>((min, s) => (!min || s.startedAt < min ? s.startedAt : min), null);
    const days = workingDays(filters.from ?? oldest ?? this.now(), this.now());
    const repositoryOf = (session: SessionView) => session.repository?.name ?? null;
    const repositories = [...new Set(sessions.map(repositoryOf))];
    const models = [...new Set(sessions.map((session) => session.model))];
    const read = sum(sessions, ({ usage }) => usage.input + usage.cacheRead + usage.cacheCreation);
    return {
      totalUsd,
      workingDays: days.length,
      averagePerWorkingDayUsd: days.length === 0 ? 0 : totalUsd / days.length,
      sessions: sessions.length,
      cacheShare: shareOf(
        sum(sessions, ({ usage }) => usage.cacheRead),
        read,
      ),
      days: days.map((date) => {
        const ofDay = sessions.filter((session) => dayOf(session.startedAt) === date);
        return {
          date,
          repositories: repositories
            .map((name) => {
              const own = ofDay.filter((session) => repositoryOf(session) === name);
              return { name, sessions: own.length, usd: sum(own, (session) => session.cost.usd) };
            })
            .filter((entry) => entry.sessions > 0),
        };
      }),
      byRepository: repositories
        .map((name) => {
          const own = sessions.filter((session) => repositoryOf(session) === name);
          const usd = sum(own, (session) => session.cost.usd);
          return { name, sessions: own.length, usd, share: shareOf(usd, totalUsd) };
        })
        .toSorted((a, b) => b.usd - a.usd),
      byModel: models
        .map((model) => {
          const usd = sum(
            sessions.filter((session) => session.model === model),
            (session) => session.cost.usd,
          );
          return { model, usd, share: shareOf(usd, totalUsd) };
        })
        .toSorted((a, b) => b.usd - a.usd),
    };
  }

  private async filtered(filters: HistoryFilters): Promise<SessionView[]> {
    const sessions = await this.sessionService.listSessions();
    const found = filters.query.trim() ? await this.sessionRepository.search(filters.query) : null;
    return sessions.filter(
      (session) =>
        (!filters.from || session.startedAt >= filters.from) &&
        (!filters.repository || session.repository?.name === filters.repository) &&
        (!filters.sourceId || session.sourceId === filters.sourceId) &&
        (!filters.state || session.state === filters.state) &&
        (!found || found.has(session.id)),
    );
  }
}
