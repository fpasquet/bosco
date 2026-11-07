import type { SessionDto, SessionStateDto, SourceDto } from '@bosco/domain';

/** Ordre des états dans la vue d'ensemble : ce qui demande une action d'abord (RF-SESS-02). */
export const STATE_ORDER: readonly SessionStateDto[] = ['waiting', 'running', 'inactive', 'ended'];

/** Colonnes de la vue par état (E1d) : les sessions terminées vont dans l'historique. */
const BOARD_STATES: readonly SessionStateDto[] = ['waiting', 'running', 'inactive'];

export const STATE_LABELS: Record<SessionStateDto, string> = {
  ended: 'Terminée',
  inactive: 'Inactive',
  running: 'En cours',
  waiting: 'T’attend',
};

export interface OverviewFilters {
  hideInactive: boolean;
  query: string;
  /** Nom du dépôt choisi dans la barre latérale (E1c) ; null : tous les dépôts */
  repository: null | string;
}

export interface RepositoryGroup {
  name: null | string;
  sessions: SessionDto[];
}

export interface OverviewIndicators {
  costToday: { unpriced: boolean; usd: number };
  /** Sessions commencées aujourd'hui et déjà terminées */
  endedToday: number;
  inactive: number;
  /** Fin d'activité de la session inactive la plus récente : « depuis 47 min » */
  inactiveSince: Date | null;
  running: number;
  sessionsToday: number;
}

function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isToday(iso: string, now: Date): boolean {
  return new Date(iso) >= startOfDay(now);
}

/**
 * Sessions ouvertes : une session terminée passe dans l'historique (E3a). Quand Claude Code ne dit pas ce qui est
 * ouvert, une session sans événement depuis aujourd'hui y passe aussi.
 */
export function openSessions(sessions: readonly SessionDto[], now: Date): SessionDto[] {
  return sessions.filter((session) =>
    session.state === 'ended' ? false : session.state !== 'inactive' || isToday(session.lastEventAt, now),
  );
}

function byStateThenActivity(left: SessionDto, right: SessionDto): number {
  const state = STATE_ORDER.indexOf(left.state) - STATE_ORDER.indexOf(right.state);
  return state === 0 ? right.lastEventAt.localeCompare(left.lastEventAt) : state;
}

/** Tri d'un dépôt : par état, puis par activité la plus récente (CA-SESS-09). */
export function sortSessions(sessions: readonly SessionDto[]): SessionDto[] {
  return sessions.toSorted(byStateThenActivity);
}

/** Dépôts dans l'ordre de leur session la plus urgente ; les sessions hors dépôt git ferment la liste. */
export function groupByRepository(sessions: readonly SessionDto[]): RepositoryGroup[] {
  const groups = new Map<null | string, SessionDto[]>();
  for (const session of sortSessions(sessions)) {
    const name = session.repository?.name ?? null;
    groups.set(name, [...(groups.get(name) ?? []), session]);
  }
  return [...groups.entries()]
    .map(([name, grouped]) => ({ name, sessions: grouped }))
    .toSorted((left, right) => {
      if (left.name === null || right.name === null) return left.name === null ? 1 : -1;
      return byStateThenActivity(left.sessions[0] as SessionDto, right.sessions[0] as SessionDto);
    });
}

/**
 * Colonnes par état (E1d) : une colonne par état, triée par activité la plus récente. La colonne T'attend n'existe
 * qu'avec le suivi en direct : elle remplace alors le bandeau (CA-SESS-14).
 */
export function groupByState(
  sessions: readonly SessionDto[],
  liveTracking = false,
): { sessions: SessionDto[]; state: SessionStateDto }[] {
  const states = BOARD_STATES.filter((state) => liveTracking || state !== 'waiting');
  return states.map((state) => ({
    state,
    sessions: sortSessions(sessions.filter((session) => session.state === state)),
  }));
}

function matches(session: SessionDto, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('fr');
  if (!needle) return true;
  return [session.title, session.branch, session.repository?.name, session.repository?.folder, session.lastAction]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLocaleLowerCase('fr').includes(needle));
}

export function filterSessions(sessions: readonly SessionDto[], filters: OverviewFilters): SessionDto[] {
  return sessions.filter(
    (session) =>
      (filters.repository === null || session.repository?.name === filters.repository) &&
      !(filters.hideInactive && session.state === 'inactive') &&
      matches(session, filters.query),
  );
}

/** Sessions qui t'attendent, la plus ancienne attente en premier (CA-SESS-05). */
export function waitingSessions(sessions: readonly SessionDto[]): SessionDto[] {
  return sessions
    .filter((session) => session.state === 'waiting' && session.waiting)
    .toSorted((left, right) => (left.waiting?.since ?? '').localeCompare(right.waiting?.since ?? ''));
}

/** Indicateurs de la vue d'ensemble ; le coût du jour additionne les sessions commencées aujourd'hui (CA-SESS-10). */
export function indicatorsOf(open: readonly SessionDto[], all: readonly SessionDto[], now: Date): OverviewIndicators {
  const today = all.filter((session) => isToday(session.startedAt, now));
  const inactive = open.filter((session) => session.state === 'inactive');
  const lastInactive = inactive.map((session) => session.lastEventAt).toSorted((a, b) => b.localeCompare(a))[0];
  return {
    running: open.filter((session) => session.state === 'running').length,
    inactive: inactive.length,
    inactiveSince: lastInactive ? new Date(lastInactive) : null,
    sessionsToday: today.length,
    endedToday: today.filter((session) => session.state === 'ended').length,
    costToday: {
      usd: today.reduce((total, session) => total + session.cost.usd, 0),
      unpriced: today.some((session) => session.cost.unpriced),
    },
  };
}

/** Dépôts de la barre latérale, dans l'ordre des intertitres, avec leur nombre de sessions ouvertes. */
export function repositoriesOf(open: readonly SessionDto[]): { count: number; name: string }[] {
  return groupByRepository(open).flatMap(({ name, sessions }) =>
    name === null ? [] : [{ name, count: sessions.length }],
  );
}

/** Profil par défaut de Claude Code (~/.claude) : ses sessions n'ont pas de marque, celles des autres portent la leur. */
export function profileMark(session: SessionDto, sources: readonly SourceDto[]): null | string {
  const source = sources.find((candidate) => candidate.id === session.sourceId);
  return !source || source.path.endsWith('/.claude') ? null : source.label;
}

export function totalTokens(usage: SessionDto['usage']): number {
  return usage.input + usage.output + usage.cacheCreation + usage.cacheRead;
}
