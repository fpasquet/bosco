import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import type { Clock } from './ports.ts';
import {
  checkQuotaThresholds,
  DEFAULT_QUOTA_SCOPE,
  DEFAULT_QUOTA_THRESHOLDS,
  type QuotaScope,
  quotaStop,
  type QuotaThresholds,
  quotaWait,
  usageOf,
} from '../domain/quota.ts';

/** Seuils, portée et dernier usage connu de chaque abonnement (profil Claude), rangés dans la base de Bosco. */
export interface QuotaStore {
  saveScope(scope: QuotaScope): Promise<void>;
  saveThresholds(thresholds: QuotaThresholds): Promise<void>;
  saveWindows(windows: Record<string, QuotaWindows>): Promise<void>;
  scope(): Promise<null | QuotaScope>;
  thresholds(): Promise<null | QuotaThresholds>;
  windows(): Promise<Record<string, QuotaWindows>>;
}

/** Usage d'un abonnement tel qu'on le montre (E11) : pourcentage et remise à zéro de chaque fenêtre. */
export interface QuotaUsage {
  fiveHour: null | { resetsAt: Date; usage: number };
  sevenDay: null | { resetsAt: Date; usage: number };
}

/**
 * Quota de l'abonnement (DT-39) : l'usage de chaque abonnement, lu à chaque tour d'une session pilotée, et les seuils
 * qui retiennent puis arrêtent ses tours ; en bac à sable seulement, ou aussi sur le poste. Les sessions lancées dans
 * un terminal ne sont jamais touchées.
 */
export class QuotaService {
  private limits: QuotaThresholds = DEFAULT_QUOTA_THRESHOLDS;
  private applied: QuotaScope = DEFAULT_QUOTA_SCOPE;
  private known: Record<string, QuotaWindows> = {};

  constructor(
    private readonly store: QuotaStore,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<void> {
    this.limits = (await this.store.thresholds()) ?? DEFAULT_QUOTA_THRESHOLDS;
    this.applied = (await this.store.scope()) ?? DEFAULT_QUOTA_SCOPE;
    this.known = await this.store.windows();
  }

  thresholds(): QuotaThresholds {
    return this.limits;
  }

  scope(): QuotaScope {
    return this.applied;
  }

  async setThresholds(thresholds: QuotaThresholds): Promise<QuotaThresholds> {
    this.limits = checkQuotaThresholds(thresholds);
    await this.store.saveThresholds(this.limits);
    return this.limits;
  }

  async setScope(scope: QuotaScope): Promise<QuotaScope> {
    this.applied = scope;
    await this.store.saveScope(scope);
    return scope;
  }

  /** Un tour a dit l'usage de l'abonnement de ce profil : la dernière valeur de chaque fenêtre est gardée. */
  async record(profile: string, windows: QuotaWindows): Promise<void> {
    this.known = { ...this.known, [profile]: { ...this.known[profile], ...windows } };
    await this.store.saveWindows(this.known);
  }

  usage(profile: string): QuotaUsage {
    const windows = this.known[profile] ?? {};
    const now = this.clock.now();
    const read = (name: 'fiveHour' | 'sevenDay') => {
      const usage = usageOf(windows, name, now);
      const window = windows[name];
      return usage === null || !window ? null : { usage, resetsAt: window.resetsAt };
    };
    return { fiveHour: read('fiveHour'), sevenDay: read('sevenDay') };
  }

  /** Pourquoi un tour de cet abonnement ne part pas ; null s'il peut partir, ou si les seuils ne le touchent pas. */
  holdReason(profile: string, sandboxed: boolean): null | string {
    if (!this.applies(sandboxed)) return null;
    return quotaWait(this.known[profile] ?? {}, this.limits, this.clock.now());
  }

  /** Pourquoi le tour en cours de cet abonnement s'arrête ; null s'il peut continuer. */
  stopReason(profile: string, sandboxed: boolean): null | string {
    if (!this.applies(sandboxed)) return null;
    return quotaStop(this.known[profile] ?? {}, this.limits, this.clock.now());
  }

  private applies(sandboxed: boolean): boolean {
    return sandboxed || this.applied === 'all';
  }
}
