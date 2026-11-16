import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import type { Clock } from './ports.ts';
import {
  checkQuotaThresholds,
  DEFAULT_QUOTA_THRESHOLDS,
  quotaStop,
  type QuotaThresholds,
  quotaWait,
  usageOf,
} from '../domain/quota.ts';

/** Seuils et dernier usage connu de chaque abonnement (profil Claude), rangés dans la base de Bosco. */
export interface QuotaStore {
  saveThresholds(thresholds: QuotaThresholds): Promise<void>;
  saveWindows(windows: Record<string, QuotaWindows>): Promise<void>;
  thresholds(): Promise<null | QuotaThresholds>;
  windows(): Promise<Record<string, QuotaWindows>>;
}

/** Usage d'un abonnement tel qu'on le montre (E11a, E5b) : pourcentage et remise à zéro de chaque fenêtre. */
export interface QuotaUsage {
  fiveHour: null | { resetsAt: Date; usage: number };
  sevenDay: null | { resetsAt: Date; usage: number };
}

/**
 * Quota de l'abonnement (RF-TACH-05, DT-39) : l'usage de chaque abonnement, lu à chaque tour d'un agent ou d'une
 * session pilotée, et les seuils qui retiennent le worker et arrêtent ses agents.
 */
export class QuotaService {
  private limits: QuotaThresholds = DEFAULT_QUOTA_THRESHOLDS;
  private known: Record<string, QuotaWindows> = {};

  constructor(
    private readonly store: QuotaStore,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<void> {
    this.limits = (await this.store.thresholds()) ?? DEFAULT_QUOTA_THRESHOLDS;
    this.known = await this.store.windows();
  }

  thresholds(): QuotaThresholds {
    return this.limits;
  }

  async setThresholds(thresholds: QuotaThresholds): Promise<QuotaThresholds> {
    this.limits = checkQuotaThresholds(thresholds);
    await this.store.saveThresholds(this.limits);
    return this.limits;
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

  /** Pourquoi une tâche de cet abonnement attend ; null si elle peut partir (CA-TACH-99). */
  waitReason(profile: string): null | string {
    return quotaWait(this.known[profile] ?? {}, this.limits, this.clock.now());
  }

  /** Pourquoi l'agent de cet abonnement s'arrête ; null s'il peut continuer (CA-TACH-100). */
  stopReason(profile: string): null | string {
    return quotaStop(this.known[profile] ?? {}, this.limits, this.clock.now());
  }
}
