const NBSP = ' ';
const ONE_DECIMAL = new Intl.NumberFormat('fr', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const INTEGER = new Intl.NumberFormat('fr', { maximumFractionDigits: 0 });
const DOLLARS = new Intl.NumberFormat('fr', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const PERCENT = new Intl.NumberFormat('fr', { maximumFractionDigits: 1 });

/** Tokens arrondis : « 41 k », « 0,7 M », « 615,1 M ». */
export function formatTokens(count: number): string {
  if (count < 1000) return INTEGER.format(count);
  if (count < 500_000) return `${INTEGER.format(count / 1000)}${NBSP}k`;
  return `${ONE_DECIMAL.format(count / 1_000_000)}${NBSP}M`;
}

/** Graduation de l'axe en millions : « 50 M », « 2,5 M », « 0 ». */
export function formatAxisTokens(count: number): string {
  if (count === 0) return '0';
  if (count < 1_000_000) return `${INTEGER.format(count / 1000)}${NBSP}k`;
  return `${PERCENT.format(count / 1_000_000)}${NBSP}M`;
}

/** Coût estimé : « 283,01 $ ». */
export function formatUsd(usd: number): string {
  return `${DOLLARS.format(usd)}${NBSP}$`;
}

/** Graduation de l'axe en dollars : « 0 $ », « 10 $ », « 0,5 $ ». */
export function formatAxisUsd(usd: number): string {
  return `${PERCENT.format(usd)}${NBSP}$`;
}

export function formatPercent(value: number): string {
  return `${PERCENT.format(value)}${NBSP}%`;
}

/** Temps de travail des agents : « 31 h 20 », « 12 min ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}${NBSP}min`;
  return `${Math.floor(minutes / 60)}${NBSP}h${NBSP}${String(minutes % 60).padStart(2, '0')}`;
}

const SHORT_DAY = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', weekday: 'short' });
const LONG_DATE = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', year: 'numeric' });

/** Jour du graphique : « jeu. 6 nov. ». */
export function dayLabel(date: string): string {
  return SHORT_DAY.format(new Date(`${date}T12:00:00`));
}

/** Premier jour connu : « 8 oct. 2026 ». */
export function sinceLabel(date: string): string {
  return LONG_DATE.format(new Date(`${date}T12:00:00`));
}
