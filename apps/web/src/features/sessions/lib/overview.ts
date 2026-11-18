import type { GroupDto, SessionDto, SessionStateDto, SourceDto } from '@bosco/domain';

/** Ordre des états dans la vue d'ensemble : ce qui demande une action d'abord. */
export const STATE_ORDER: readonly SessionStateDto[] = ['waiting', 'running', 'inactive', 'ended'];

/** Colonnes de la vue par état : les sessions terminées vont dans l'historique. */
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
}

export interface ProjectGroup {
  /** Mention de chaque session qui figure aussi ailleurs (« aussi dans Node.js »), par identifiant */
  also?: Record<string, string>;
  /** Projet de chaque session (« api-tarifs +2 », « creneaux/packages/paiement »), par identifiant */
  labels?: Record<string, string>;
  /** Groupe de l'intertitre, pour son lien « Réglages du groupe » */
  group?: { id: number; projects: number };
  /** Intertitre ; null : « Hors projet » */
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
 * Sessions ouvertes : une session terminée passe dans l'historique. Quand Claude Code ne dit pas ce qui est
 * ouvert, une session sans événement depuis aujourd'hui y passe aussi.
 */
export function openSessions(sessions: readonly SessionDto[], now: Date): SessionDto[] {
  return sessions.filter((session) => {
    return session.state === 'ended' ? false : session.state !== 'inactive' || isToday(session.lastEventAt, now);
  });
}

/** Sessions terminées aujourd'hui, des plus récentes aux plus anciennes. */
export function endedToday(sessions: readonly SessionDto[], now: Date): SessionDto[] {
  return sessions
    .filter((session) => session.state === 'ended' && isToday(session.lastEventAt, now))
    .toSorted((left, right) => right.lastEventAt.localeCompare(left.lastEventAt));
}

function byStateThenActivity(left: SessionDto, right: SessionDto): number {
  const state = STATE_ORDER.indexOf(left.state) - STATE_ORDER.indexOf(right.state);
  return state === 0 ? right.lastEventAt.localeCompare(left.lastEventAt) : state;
}

/** Tri d'un projet : par état, puis par activité la plus récente. */
export function sortSessions(sessions: readonly SessionDto[]): SessionDto[] {
  return sessions.toSorted(byStateThenActivity);
}

/** Une session à plusieurs projets se nomme d'après son principal et le nombre des autres (« api-tarifs +2 »). */
function labelsOf(sessions: readonly SessionDto[]): Record<string, string> {
  return Object.fromEntries(
    sessions.flatMap((session) =>
      session.addedProjects.length > 0 ? [[session.id, projectLabel(session) ?? '']] : [],
    ),
  );
}

/**
 * Projet de chaque session d'un groupe, sous son titre : le principal et le nombre des autres (« api-tarifs +2 »), ou
 * le projet et le dossier de la session (« creneaux/packages/paiement »).
 */
function placesOf(sessions: readonly SessionDto[]): Record<string, string> {
  return Object.fromEntries(
    sessions.flatMap((session) => {
      if (!session.project) return [];
      const { folder, name } = session.project;
      return [
        [
          session.id,
          session.addedProjects.length > 0 ? (projectLabel(session) ?? '') : [name, folder].filter(Boolean).join('/'),
        ],
      ];
    }),
  );
}

/** Projets dans l'ordre de leur session la plus urgente ; les sessions hors projet ferment la liste. */
export function groupByProject(sessions: readonly SessionDto[]): ProjectGroup[] {
  const groups = new Map<null | string, SessionDto[]>();
  for (const session of sortSessions(sessions)) {
    const name = session.project?.name ?? null;
    groups.set(name, [...(groups.get(name) ?? []), session]);
  }
  return [...groups.entries()]
    .map(([name, grouped]) => ({ labels: labelsOf(grouped), name, sessions: grouped }))
    .toSorted((left, right) => {
      if (left.name === null || right.name === null) return left.name === null ? 1 : -1;
      return byStateThenActivity(left.sessions[0] as SessionDto, right.sessions[0] as SessionDto);
    });
}

/**
 * Colonnes par état : une colonne par état, triée par activité la plus récente. La colonne T'attend n'existe
 * qu'avec le suivi en direct : elle remplace alors le bandeau.
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
  return [session.title, session.branch, session.project?.name, session.project?.folder, session.lastAction]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLocaleLowerCase('fr').includes(needle));
}

export function filterSessions(sessions: readonly SessionDto[], filters: OverviewFilters): SessionDto[] {
  return sessions.filter(
    (session) => !(filters.hideInactive && session.state === 'inactive') && matches(session, filters.query),
  );
}

/** Projets d'une session : le principal, puis ceux qu'elle voit en plus. */
function projectIds(session: SessionDto): number[] {
  return [session.project?.id, ...session.addedProjects.map(({ id }) => id)].filter(
    (id): id is number => id !== null && id !== undefined,
  );
}

/**
 * Sessions d'une page de projet ou de groupe : celles dont le projet principal est l'un des siens, une fois chacune ;
 * une session hors projet n'est dans aucune. Pour un groupe, aussi celles qui voient l'un de ses projets.
 */
export function sessionsIn(
  sessions: readonly SessionDto[],
  projects: readonly number[],
  added: 'also' | 'principal' = 'principal',
): SessionDto[] {
  const ids = new Set(projects);
  return sessions.filter((session) =>
    added === 'also'
      ? projectIds(session).some((id) => ids.has(id))
      : session.project !== null && ids.has(session.project.id),
  );
}

/**
 * « Aussi dans ce projet » : les sessions à plusieurs projets dont ce projet est un projet ajouté,
 * et non le principal ; elles comptent dans la page de leur projet principal.
 */
export function alsoIn(sessions: readonly SessionDto[], project: number): SessionDto[] {
  return sessions.filter(
    (session) => session.project?.id !== project && session.addedProjects.some(({ id }) => id === project),
  );
}

/**
 * Vue regroupée par groupe : un intertitre par groupe, dans l'ordre de la barre latérale, avec les sessions qui
 * touchent l'un de ses projets ; une session de plusieurs groupes figure dans chacun, avec la mention des autres.
 * « Sans groupe » puis « Hors projet » ferment la liste s'ils ont des sessions ; « Tous les projets » n'en a pas.
 */
export function groupByGroup(sessions: readonly SessionDto[], groups: readonly GroupDto[]): ProjectGroup[] {
  const named = groups.filter((group) => !group.system);
  const groupsOf = (session: SessionDto) => {
    const ids = new Set(projectIds(session));
    return named.filter((group) => group.projects.some(({ id }) => ids.has(id)));
  };
  const sorted = sortSessions(sessions);
  const byGroup: ProjectGroup[] = named.flatMap((group) => {
    const inGroup = sorted.filter((session) => groupsOf(session).includes(group));
    if (inGroup.length === 0) return [];
    const also = Object.fromEntries(
      inGroup.flatMap((session) => {
        const others = groupsOf(session).filter((other) => other !== group);
        return others.length > 0 ? [[session.id, `aussi dans ${others.map(({ name }) => name).join(', ')}`]] : [];
      }),
    );
    return [
      {
        also,
        group: { id: group.id, projects: group.projects.length },
        labels: placesOf(inGroup),
        name: group.name,
        sessions: inGroup,
      },
    ];
  });
  const ungrouped = sorted.filter((session) => session.project !== null && groupsOf(session).length === 0);
  const outside = sorted.filter((session) => session.project === null);
  return [
    ...byGroup,
    ...(ungrouped.length > 0 ? [{ name: 'Sans groupe', sessions: ungrouped }] : []),
    ...(outside.length > 0 ? [{ name: null, sessions: outside }] : []),
  ];
}

/** Sessions qui t'attendent, la plus ancienne attente en premier. */
export function waitingSessions(sessions: readonly SessionDto[]): SessionDto[] {
  return sessions
    .filter((session) => session.state === 'waiting' && session.waiting)
    .toSorted((left, right) => (left.waiting?.since ?? '').localeCompare(right.waiting?.since ?? ''));
}

/** Indicateurs de la vue d'ensemble ; le coût du jour additionne les sessions commencées aujourd'hui. */
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

/** Sessions ouvertes d'une ligne de la barre latérale, et celles qui t'attendent. */
export interface PlaceActivity {
  count: number;
  waiting: number;
}

function activityOf(sessions: readonly SessionDto[]): PlaceActivity {
  return { count: sessions.length, waiting: sessions.filter((session) => session.state === 'waiting').length };
}

/**
 * Projets de la barre latérale qui ont une session ouverte, dans l'ordre des intertitres (le plus urgent d'abord), et
 * les sessions hors projet.
 */
export function projectsOf(open: readonly SessionDto[]): {
  outside: PlaceActivity;
  projects: (PlaceActivity & { id: number })[];
} {
  const outside = open.filter((session) => session.project === null);
  return {
    outside: activityOf(outside),
    projects: groupByProject(open).flatMap(({ sessions }) => {
      const id = sessions[0]?.project?.id;
      return id === undefined ? [] : [{ id, ...activityOf(sessions) }];
    }),
  };
}

/** « api-tarifs +2 » : le projet principal d'une session et le nombre des autres. */
export function projectLabel(session: SessionDto): null | string {
  if (!session.project) return null;
  const others = session.addedProjects.length;
  return others > 0 ? `${session.project.name} +${others}` : session.project.name;
}

/** Profil par défaut de Claude Code (~/.claude) : ses sessions n'ont pas de marque, celles des autres portent la leur. */
export function profileMark(session: SessionDto, sources: readonly SourceDto[]): null | string {
  const source = sources.find((candidate) => candidate.id === session.sourceId);
  return !source || source.path.endsWith('/.claude') ? null : source.label;
}

export function totalTokens(usage: SessionDto['usage']): number {
  return usage.input + usage.output + usage.cacheCreation + usage.cacheRead;
}
