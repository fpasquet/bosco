/**
 * Usage de l'abonnement Claude (DT-39) : chaque tour de `claude -p` en flux JSON émet un `rate_limit_event` dont
 * `rate_limit_info.unifiedWindows` donne, par fenêtre, la part utilisée (0 à 1) et l'heure de remise à zéro (en
 * secondes). Champ non documenté, constaté sur Claude Code 2.1.325 et vérifié par `make claude-compat`.
 */
export type QuotaWindowName = 'fiveHour' | 'sevenDay';

export interface QuotaWindow {
  resetsAt: Date;
  /** Part utilisée de la fenêtre, de 0 à 1 */
  utilization: number;
}

export type QuotaWindows = Partial<Record<QuotaWindowName, QuotaWindow>>;

const NAMES: Record<string, QuotaWindowName> = { five_hour: 'fiveHour', seven_day: 'sevenDay' };

/** Les fenêtres d'une ligne du flux JSON ; null si ce n'est pas un `rate_limit_event` lisible. */
export function quotaWindowsOf(line: unknown): null | QuotaWindows {
  const event = line as { rate_limit_info?: { unifiedWindows?: unknown }; type?: unknown } | null;
  if (event?.type !== 'rate_limit_event') return null;
  const windows = event.rate_limit_info?.unifiedWindows;
  if (typeof windows !== 'object' || windows === null) return null;
  const read: QuotaWindows = {};
  for (const [key, value] of Object.entries(windows as Record<string, unknown>)) {
    const name = NAMES[key];
    const { resetsAt, utilization } = (value ?? {}) as { resetsAt?: unknown; utilization?: unknown };
    if (!name || typeof utilization !== 'number' || typeof resetsAt !== 'number') continue;
    read[name] = { utilization: Math.max(0, Math.min(1, utilization)), resetsAt: new Date(resetsAt * 1000) };
  }
  return Object.keys(read).length > 0 ? read : null;
}
