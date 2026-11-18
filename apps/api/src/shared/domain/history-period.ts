/**
 * Période des sessions importées dans l'historique : les 30 derniers jours (par défaut) ou tout ce que gardent les
 * profils. Partagée par les sessions, qui lisent les transcripts, et les données de Bosco, qui la règlent.
 */
export type HistoryPeriod = '30-days' | 'all';

export const HISTORY_PERIODS: readonly HistoryPeriod[] = ['30-days', 'all'];

/** Les sessions lues par défaut : celles des 30 derniers jours. */
export const HISTORY_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Date des plus anciens transcripts lus ; tout l'historique ne laisse aucun transcript de côté. */
export function historyStart(period: HistoryPeriod, now: Date): Date {
  return period === 'all' ? new Date(0) : new Date(now.getTime() - HISTORY_DAYS * DAY_MS);
}

/** Lit une période venue d'ailleurs (base, requête) ; inconnue, elle reste celle par défaut. */
export function historyPeriodOf(value: unknown): HistoryPeriod {
  return HISTORY_PERIODS.find((period) => period === value) ?? '30-days';
}
