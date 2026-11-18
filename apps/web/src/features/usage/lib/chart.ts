import type { UsageDayDto, UsageTokensDto } from '@bosco/domain';

/** Mesure du graphique : les tokens, ou le coût estimé, sur le même axe unique. */
export type UsageMeasure = 'cost' | 'tokens';

export type SeriesKey = keyof UsageTokensDto;

/**
 * Les quatre séries, dans l'ordre fixe de leurs tokens de couleur (series-1 à series-4) : la couleur suit la série,
 * jamais son rang. Empilées du bas vers le haut : lecture du cache, écriture en cache, sortie, entrée.
 */
export const SERIES: readonly { color: 1 | 2 | 3 | 4; key: SeriesKey; label: string }[] = [
  { key: 'input', label: 'Entrée', color: 1 },
  { key: 'output', label: 'Sortie', color: 2 },
  { key: 'cacheRead', label: 'Lecture du cache', color: 3 },
  { key: 'cacheCreation', label: 'Écriture en cache', color: 4 },
];

export const STACK_ORDER: readonly SeriesKey[] = ['cacheRead', 'cacheCreation', 'output', 'input'];

/** Espace entre deux segments empilés, et hauteur d'un segment trop fin pour se voir. */
export const GAP = 2;
export const MIN_SEGMENT = 2;

export function valueOf(day: UsageDayDto, key: SeriesKey, measure: UsageMeasure): number {
  return measure === 'tokens' ? day.tokens[key] : day.cost[key];
}

export function totalOf(day: UsageDayDto, measure: UsageMeasure): number {
  return SERIES.reduce((total, { key }) => total + valueOf(day, key, measure), 0);
}

/** Haut de l'axe et ses graduations : trois pas ronds (1, 2, 2,5, 5 × 10ⁿ) au-dessus du jour le plus haut. */
export function axisOf(max: number): { max: number; ticks: number[] } {
  if (max <= 0) return { max: 1, ticks: [0, 1] };
  const raw = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= raw) ?? 10) * magnitude;
  return { max: step * 3, ticks: [0, step, step * 2, step * 3] };
}

/** Segments d'une barre, du bas vers le haut, en pixels : 2 px entre deux segments, 2 px au moins chacun. */
export function segmentsOf(
  day: UsageDayDto,
  measure: UsageMeasure,
  scale: number,
): { color: 1 | 2 | 3 | 4; height: number; key: SeriesKey; offset: number }[] {
  let offset = 0;
  return STACK_ORDER.flatMap((key) => {
    const value = valueOf(day, key, measure);
    if (value <= 0) return [];
    const height = Math.max(MIN_SEGMENT, value * scale);
    const segment = { key, height, offset, color: SERIES.find((series) => series.key === key)?.color ?? 1 };
    offset += height + GAP;
    return [segment];
  });
}

/** Jours dont le total s'inscrit au-dessus de la barre : le pic, et le dernier. */
export function labeledDays(days: readonly UsageDayDto[], measure: UsageMeasure): Set<number> {
  if (days.length === 0) return new Set();
  const totals = days.map((day) => totalOf(day, measure));
  const peak = totals.indexOf(Math.max(...totals));
  return new Set([peak, days.length - 1].filter((index) => (totals[index] ?? 0) > 0));
}
