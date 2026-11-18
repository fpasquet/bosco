import type { TokenUsage } from '../domain/token-usage.ts';
import type { PilotRecord } from './pilot.service.ts';
import type { CatalogGroup, CatalogProject, Clock, RecordedTurn, SourceRepository, UsageRepository } from './ports.ts';
import type { SessionService, SessionView } from './session.service.ts';
import { estimateCostBreakdown, modelFamily } from '../domain/model-pricing.ts';

/** Filtres de la page Usage : ils valent pour toute la page, sauf le quota. */
export interface UsageFilters {
  /** Nombre de jours jusqu'à aujourd'hui compris ; null : depuis le début */
  days: null | number;
  groupId: null | number;
  /** Modèle, sans sa date de version */
  model: null | string;
  projectId: null | number;
  sourceId: null | string;
}

/** Tokens et coût estimé (en dollars) d'une journée, par sorte de tokens. */
export interface UsageDay {
  cost: { cacheCreation: number; cacheRead: number; input: number; output: number };
  date: string;
  tokens: { cacheCreation: number; cacheRead: number; input: number; output: number };
}

/** Une ligne de la répartition : sa part du coût estimé ; usd null pour un modèle sans tarif (« non chiffré »). */
export interface UsageShare {
  /** Lignes regroupées dans « autres » */
  count?: number;
  /** Dossier d'une ligne hors projet (chemin absolu) : ses sessions n'ont pas de projet */
  folder?: string;
  key: string;
  label: string;
  /** Projet de la ligne, qui filtre la page au clic ; null : hors projet ou « autres » */
  projectId?: null | number;
  share: number;
  usd: null | number;
}

export interface UsageReport {
  activity: {
    /** Durée cumulée des tours : de ta demande à la dernière action de l'agent qui la suit, en secondes */
    agentWorkSeconds: number;
    pilotedSessions: number;
    pullRequests: number;
    retrievedBranches: number;
    sandboxes: number;
  };
  byModel: UsageShare[];
  /** Ce que coûtent les sessions elles-mêmes et leurs sous-agents */
  byOrigin: UsageShare[];
  byProfile: UsageShare[];
  byProject: UsageShare[];
  days: UsageDay[];
  /** Modèles de la période, proposés par le filtre */
  models: string[];
  /** Premier jour de la période (AAAA-MM-JJ) */
  from: string;
  /** Premier jour où des tours sont connus ; null sans aucun tour */
  since: null | string;
  tokens: {
    cacheCreation: number;
    cacheRead: number;
    /** Lecture du cache / (entrée + lecture du cache), en % */
    cacheReuse: number;
    costUsd: number;
    input: number;
    output: number;
    sessions: number;
    /** Part des sous-agents, comprise dans les totaux */
    subagents: { costUsd: number; tokens: number };
    /** Réponses de l'agent des sessions, sans celles de leurs sous-agents */
    turns: number;
    /** Part des tours qui n'ont rien relu du cache, en % */
    turnsWithoutCacheRead: number;
    /** Modèles sans tarif connu : leurs tokens sont comptés, pas leur coût */
    unpricedModels: string[];
  };
}

/** Lignes nommées d'une répartition avant que les suivantes ne soient regroupées en « autres ». */
const SHOWN_SHARES = 5;

const MICROS = 1_000_000;

/** Jour local d'une date, en AAAA-MM-JJ : les journées suivent l'heure du poste. */
function dayOf(date: Date): string {
  return date.toLocaleDateString('sv');
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Jours d'une période, du premier à aujourd'hui compris. */
function daysBetween(from: Date, to: Date): string[] {
  const days: string[] = [];
  for (const cursor = startOfDay(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) days.push(dayOf(cursor));
  return days;
}

/** Un montant en dollars, au millionième : assez pour la page, sans les restes des additions de flottants. */
function dollars(value: number): number {
  return Math.round(value * MICROS) / MICROS;
}

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

/** Projets d'une session : le principal, puis ceux qu'elle voit en plus. */
function projectsOf(view: SessionView): number[] {
  return [view.project?.id, ...view.addedProjects.map(({ id }) => id)].filter(
    (id): id is number => typeof id === 'number',
  );
}

/** Lignes de la répartition par projet d'une session : ses projets, sinon son dossier hors projet. */
function linesOf(
  folder: null | string,
  projects: number[],
  names: Map<number, string>,
): Omit<UsageShare, 'share' | 'usd'>[] {
  if (projects.length > 0)
    return projects.map((id) => ({ key: `project:${id}`, label: names.get(id) ?? `Projet ${id}`, projectId: id }));
  // Hors projet : une ligne par dossier, pour voir ce qui n'est rangé nulle part
  if (folder) return [{ folder, key: `outside:${folder}`, label: folder, projectId: null }];
  return [{ key: 'outside', label: 'Hors projet', projectId: null }];
}

/** Les plus gros d'abord, sans en regrouper aucun. */
function sorted(entries: UsageShare[]): UsageShare[] {
  return entries
    .map((share) => ({ ...share, usd: share.usd === null ? null : dollars(share.usd) }))
    .toSorted((left, right) => (right.usd ?? -1) - (left.usd ?? -1) || left.label.localeCompare(right.label, 'fr'));
}

/** Les plus gros d'abord ; au-delà de cinq, les suivants sont regroupés en « autres ». */
function ranked(entries: UsageShare[], total: number): UsageShare[] {
  const shares = sorted(entries);
  if (shares.length <= SHOWN_SHARES + 1) return shares;
  const rest = shares.slice(SHOWN_SHARES);
  const usd = rest.reduce((sum, share) => sum + (share.usd ?? 0), 0);
  return [
    ...shares.slice(0, SHOWN_SHARES),
    {
      key: 'others',
      label: `${rest.length} autres`,
      count: rest.length,
      projectId: null,
      usd,
      share: percent(usd, total),
    },
  ];
}

/**
 * Page Usage : activité de Bosco, tokens et coût estimé, usage par jour et répartition, calculés
 * à partir des tours enregistrés à la lecture des transcripts et de ce que Bosco garde de ses sessions pilotées. Une
 * session à plusieurs projets compte pour chacun de ses projets dans la répartition, une seule fois dans les totaux.
 */
export class UsageService {
  constructor(
    private readonly usage: UsageRepository,
    private readonly sessions: Pick<SessionService, 'knownGroups' | 'knownProjects' | 'listSessions'>,
    private readonly sources: Pick<SourceRepository, 'list'>,
    private readonly pilots: { list(): Promise<PilotRecord[]> },
    private readonly clock: Clock,
  ) {}

  async usageReport(filters: UsageFilters): Promise<UsageReport> {
    const now = this.clock.now();
    const from = filters.days === null ? null : startOfDay(new Date(now.getTime() - (filters.days - 1) * 86_400_000));
    const [views, groups, projects, sources, records, firstTurnAt] = await Promise.all([
      this.sessions.listSessions(),
      this.sessions.knownGroups(),
      this.sessions.knownProjects(),
      this.sources.list(),
      this.pilots.list(),
      this.usage.firstTurnAt(),
    ]);
    const [allTurns, pullRequests, activity] = await Promise.all([
      this.usage.listTurns(from),
      this.usage.listPullRequests(from),
      this.usage.listActivity(from),
    ]);
    const scope = this.scopeOf(filters, groups);
    const byId = new Map(views.map((view) => [view.id, view]));
    const inScope = (view: SessionView | undefined) =>
      view !== undefined &&
      (!filters.sourceId || view.sourceId === filters.sourceId) &&
      (!scope || projectsOf(view).some((id) => scope.has(id)));
    const scopedTurns = allTurns.filter((turn) => inScope(byId.get(turn.sessionId)));
    const turns = filters.model
      ? scopedTurns.filter((turn) => turn.model !== null && modelFamily(turn.model) === filters.model)
      : scopedTurns;
    const modelSessions = new Set(turns.map((turn) => turn.sessionId));
    const counted = (sessionId: string) =>
      inScope(byId.get(sessionId)) && (!filters.model || modelSessions.has(sessionId));
    const first = firstTurnAt ?? null;
    const start = from ?? first ?? startOfDay(now);
    const priced = turns.map((turn) => ({ turn, cost: estimateCostBreakdown(turn.model, turn.usage) }));
    const costOf = (cost: ReturnType<typeof estimateCostBreakdown>) =>
      cost ? (cost.input + cost.output + cost.cacheCreation + cost.cacheRead) / MICROS : 0;
    const totalUsd = priced.reduce((sum, { cost }) => sum + costOf(cost), 0);
    const sum = (pick: (usage: TokenUsage) => number) => turns.reduce((total, turn) => total + pick(turn.usage), 0);
    const input = sum((usage) => usage.input);
    const cacheRead = sum((usage) => usage.cacheRead);
    // Les tours sont ceux des sessions ; leurs sous-agents comptent dans les tokens et le coût
    const ownTurns = turns.filter((turn) => !turn.subagent);
    const subagentUsd = priced.reduce((total, { cost, turn }) => total + (turn.subagent ? costOf(cost) : 0), 0);
    return {
      from: dayOf(start),
      since: first ? dayOf(first) : null,
      models: [...new Set(scopedTurns.flatMap((turn) => (turn.model ? [modelFamily(turn.model)] : [])))].toSorted(
        (left, right) => left.localeCompare(right),
      ),
      activity: {
        agentWorkSeconds: workSeconds(activity.filter((entry) => counted(entry.sessionId))),
        ...this.pilotedActivity(records, from, counted),
        pullRequests: pullRequests.filter((pullRequest) => counted(pullRequest.sessionId)).length,
      },
      tokens: {
        input,
        output: sum((usage) => usage.output),
        cacheRead,
        cacheCreation: sum((usage) => usage.cacheCreation),
        cacheReuse: percent(cacheRead, input + cacheRead),
        turnsWithoutCacheRead: percent(ownTurns.filter((turn) => turn.usage.cacheRead === 0).length, ownTurns.length),
        sessions: modelSessions.size,
        subagents: {
          costUsd: dollars(subagentUsd),
          tokens: turns.reduce((total, turn) => total + (turn.subagent ? turn.usage.total : 0), 0),
        },
        turns: ownTurns.length,
        costUsd: dollars(totalUsd),
        unpricedModels: [
          ...new Set(
            priced.flatMap(({ cost, turn }) => (cost ? [] : [turn.model ? modelFamily(turn.model) : 'inconnu'])),
          ),
        ].toSorted((left, right) => left.localeCompare(right)),
      },
      days: daysBetween(start, now).map((date) => {
        const ofDay = priced.filter(({ turn }) => dayOf(turn.at) === date);
        const add = (pick: (entry: (typeof ofDay)[number]) => number) =>
          ofDay.reduce((total, entry) => total + pick(entry), 0);
        return {
          date,
          tokens: {
            input: add(({ turn }) => turn.usage.input),
            output: add(({ turn }) => turn.usage.output),
            cacheRead: add(({ turn }) => turn.usage.cacheRead),
            cacheCreation: add(({ turn }) => turn.usage.cacheCreation),
          },
          cost: {
            input: dollars(add(({ cost }) => (cost?.input ?? 0) / MICROS)),
            output: dollars(add(({ cost }) => (cost?.output ?? 0) / MICROS)),
            cacheRead: dollars(add(({ cost }) => (cost?.cacheRead ?? 0) / MICROS)),
            cacheCreation: dollars(add(({ cost }) => (cost?.cacheCreation ?? 0) / MICROS)),
          },
        };
      }),
      byProject: this.byProject(priced, byId, scope, projects, totalUsd, costOf),
      byModel: this.byModel(priced, totalUsd, costOf),
      byOrigin: byOrigin(totalUsd, subagentUsd),
      byProfile: this.byProfile(priced, byId, sources, totalUsd, costOf),
    };
  }

  /** Projets qui bornent la page : ceux du groupe choisi, ou le projet choisi ; null : tous. */
  private scopeOf(filters: UsageFilters, groups: CatalogGroup[]): null | Set<number> {
    if (filters.projectId !== null) return new Set([filters.projectId]);
    if (filters.groupId === null) return null;
    return new Set(groups.find((group) => group.id === filters.groupId)?.projects ?? []);
  }

  /** Sessions pilotées lancées, bacs à sable créés et branches récupérées pendant la période. */
  private pilotedActivity(
    records: PilotRecord[],
    from: Date | null,
    counted: (sessionId: string) => boolean,
  ): { pilotedSessions: number; retrievedBranches: number; sandboxes: number } {
    const within = (date: Date | null) => date !== null && (!from || date >= from);
    const started = records.filter((record) => within(record.since) && counted(record.sessionId));
    const retrieved = records
      .filter((record) => counted(record.sessionId))
      .flatMap((record) =>
        record.sandbox ? [record.sandbox.retrievedAt, ...record.sandbox.copies.map((copy) => copy.retrievedAt)] : [],
      );
    return {
      pilotedSessions: started.length,
      sandboxes: started.filter((record) => record.sandbox !== null).length,
      retrievedBranches: retrieved.filter(within).length,
    };
  }

  /**
   * Chaque projet, les plus gros d'abord, sans regroupement : la page les montre tous. Une session à plusieurs projets
   * compte pour chacun de ses projets du périmètre ; une session hors projet compte pour son dossier.
   */
  private byProject(
    priced: { cost: ReturnType<typeof estimateCostBreakdown>; turn: RecordedTurn }[],
    byId: Map<string, SessionView>,
    scope: null | Set<number>,
    projects: CatalogProject[],
    total: number,
    costOf: (cost: ReturnType<typeof estimateCostBreakdown>) => number,
  ): UsageShare[] {
    const lines = new Map<string, Omit<UsageShare, 'share' | 'usd'> & { usd: number }>();
    const names = new Map<number, string>(projects.map((project) => [project.id, project.name]));
    const add = (line: Omit<UsageShare, 'share' | 'usd'>, usd: number) =>
      lines.set(line.key, { ...line, usd: (lines.get(line.key)?.usd ?? 0) + usd });
    for (const { cost, turn } of priced) {
      const view = byId.get(turn.sessionId);
      if (!view) continue;
      const own = projectsOf(view).filter((id) => !scope || scope.has(id));
      for (const known of [view.project, ...view.addedProjects])
        if (known && typeof known.id === 'number' && !names.has(known.id)) names.set(known.id, known.name);
      for (const line of linesOf(view.folder, own, names)) add(line, costOf(cost));
    }
    return sorted([...lines.values()].map((line) => ({ ...line, share: percent(line.usd, total) })));
  }

  private byModel(
    priced: { cost: ReturnType<typeof estimateCostBreakdown>; turn: RecordedTurn }[],
    total: number,
    costOf: (cost: ReturnType<typeof estimateCostBreakdown>) => number,
  ): UsageShare[] {
    const usd = new Map<string, null | number>();
    for (const { cost, turn } of priced) {
      const model = turn.model ? modelFamily(turn.model) : 'inconnu';
      usd.set(model, cost ? (usd.get(model) ?? 0) + costOf(cost) : (usd.get(model) ?? null));
    }
    return ranked(
      [...usd.entries()].map(([model, value]) => ({
        key: `model:${model}`,
        label: model,
        usd: value,
        share: value === null ? 0 : percent(value, total),
      })),
      total,
    );
  }

  private byProfile(
    priced: { cost: ReturnType<typeof estimateCostBreakdown>; turn: RecordedTurn }[],
    byId: Map<string, SessionView>,
    sources: { id: string; label: string }[],
    total: number,
    costOf: (cost: ReturnType<typeof estimateCostBreakdown>) => number,
  ): UsageShare[] {
    const usd = new Map<string, number>();
    for (const { cost, turn } of priced) {
      const sourceId = byId.get(turn.sessionId)?.sourceId;
      if (sourceId) usd.set(sourceId, (usd.get(sourceId) ?? 0) + costOf(cost));
    }
    return ranked(
      [...usd.entries()].map(([sourceId, value]) => ({
        key: `profile:${sourceId}`,
        label: sources.find((source) => source.id === sourceId)?.label ?? sourceId,
        usd: value,
        share: percent(value, total),
      })),
      total,
    );
  }
}

/** Les sessions elles-mêmes, puis leurs sous-agents ; vide sans aucun coût. */
function byOrigin(total: number, subagents: number): UsageShare[] {
  if (total === 0) return [];
  const own = total - subagents;
  return [
    { key: 'origin:sessions', label: 'Sessions', usd: dollars(own), share: percent(own, total) },
    { key: 'origin:subagents', label: 'Sous-agents', usd: dollars(subagents), share: percent(subagents, total) },
  ];
}

/**
 * Temps de travail des agents : chaque tour va de ta demande à la dernière entrée du journal qui la suit, avant la
 * demande suivante. Les entrées arrivent dans l'ordre de chaque session.
 */
export function workSeconds(entries: { at: Date; kind: string; sessionId: string }[]): number {
  let total = 0;
  let turn: { end: Date; sessionId: string; start: Date } | null = null;
  const close = () => {
    if (turn) total += (turn.end.getTime() - turn.start.getTime()) / 1000;
    turn = null;
  };
  for (const entry of entries) {
    if (turn && turn.sessionId !== entry.sessionId) close();
    if (entry.kind === 'prompt') {
      close();
      turn = { start: entry.at, end: entry.at, sessionId: entry.sessionId };
    } else if (turn && entry.at > turn.end) turn.end = entry.at;
  }
  close();
  return Math.round(total);
}
