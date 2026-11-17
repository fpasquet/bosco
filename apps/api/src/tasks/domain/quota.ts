import type { QuotaWindowName, QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Quota de l'abonnement (RF-TACH-05, DT-39) : au-delà de son seuil d'attente, le worker ne lance plus de tâche de cet
 * abonnement ; au-delà de son seuil d'arrêt, l'agent en cours s'arrête. Seuils en pourcentage, par fenêtre.
 */
export type QuotaThresholds = Record<QuotaWindowName, { stop: number; wait: number }>;

export const DEFAULT_QUOTA_THRESHOLDS: QuotaThresholds = {
  fiveHour: { wait: 50, stop: 80 },
  sevenDay: { wait: 70, stop: 90 },
};

export class InvalidQuota extends DomainError {
  constructor(message: string) {
    super('invalidQuota', message);
  }
}

const ORDER: QuotaWindowName[] = ['fiveHour', 'sevenDay'];
const CLOCK = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('fr', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

/** Part utilisée d'une fenêtre, en pourcentage ; une fenêtre remise à zéro repart de 0, une fenêtre jamais lue : null. */
export function usageOf(windows: QuotaWindows, name: QuotaWindowName, now: Date): null | number {
  const window = windows[name];
  if (!window) return null;
  return window.resetsAt <= now ? 0 : Math.round(window.utilization * 100);
}

/** La tâche attend : « Quota de l'abonnement : 5 h à 52 %, reprise vers 16:00 » ; null si elle peut partir. */
export function quotaWait(windows: QuotaWindows, thresholds: QuotaThresholds, now: Date): null | string {
  for (const name of ORDER) {
    const usage = usageOf(windows, name, now);
    const window = windows[name];
    if (usage === null || !window || usage < thresholds[name].wait) continue;
    const when = name === 'fiveHour' ? `vers ${CLOCK.format(window.resetsAt)}` : DAY.format(window.resetsAt);
    return `Quota de l’abonnement : ${name === 'fiveHour' ? '5 h' : 'semaine'} à ${usage} %, reprise ${when}`;
  }
  return null;
}

/** L'agent s'arrête : « Quota de l'abonnement atteint : fenêtre de 5 h à 81 % » ; null s'il peut continuer. */
export function quotaStop(windows: QuotaWindows, thresholds: QuotaThresholds, now: Date): null | string {
  for (const name of ORDER) {
    const usage = usageOf(windows, name, now);
    if (usage === null || usage < thresholds[name].stop) continue;
    return `Quota de l’abonnement atteint : ${name === 'fiveHour' ? 'fenêtre de 5 h' : 'semaine'} à ${usage} %`;
  }
  return null;
}

/** Des seuils entiers de 1 à 100 %, l'attente sous l'arrêt (CA-CONT-99). */
export function checkQuotaThresholds(thresholds: QuotaThresholds): QuotaThresholds {
  for (const name of ORDER) {
    const { stop, wait } = thresholds[name];
    const label = name === 'fiveHour' ? 'fenêtre de 5 h' : 'semaine';
    if (![stop, wait].every((value) => Number.isInteger(value) && value >= 1 && value <= 100))
      throw new InvalidQuota(`Les seuils de la ${label} vont de 1 à 100 %.`);
    if (wait >= stop) throw new InvalidQuota(`Pour la ${label}, le seuil d’attente reste sous le seuil d’arrêt.`);
  }
  return thresholds;
}
