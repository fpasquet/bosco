import type { CostReportDto, SessionDto } from '@bosco/domain';

const WEEKDAY = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', weekday: 'long' });

/** « Aujourd'hui », « Hier », ou « mardi 4 nov. » pour un jour AAAA-MM-JJ. */
export function dayTitle(date: string, now: Date): string {
  const today = now.toLocaleDateString('sv');
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toLocaleDateString('sv');
  if (date === today) return 'Aujourd’hui';
  if (date === yesterday) return 'Hier';
  const label = WEEKDAY.format(new Date(`${date}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « labo-ia · packages/rag », « labo-ia · racine du dépôt » */
export function whereOf(session: SessionDto): string {
  if (!session.repository) return session.repoPath ?? 'Hors dépôt git';
  return `${session.repository.name} · ${session.repository.folder || 'racine du dépôt'}`;
}

/** Séries du graphique : les trois dépôts qui coûtent le plus, puis « autres dépôts » (E3b, annotation 2). */
export function chartSeries(report: CostReportDto): { name: null | string; label: string }[] {
  const top = report.byRepository.slice(0, 3).map(({ name }) => ({ name, label: name ?? 'Hors dépôt git' }));
  return report.byRepository.length > 3 ? [...top, { name: '*', label: 'autres dépôts' }] : top;
}

/** Coût d'un jour pour une série ; « * » cumule les dépôts hors des trois premiers. */
export function seriesCost(
  day: CostReportDto['days'][number],
  series: { name: null | string },
  top: readonly (null | string)[],
): number {
  return day.repositories
    .filter((entry) => (series.name === '*' ? !top.includes(entry.name) : entry.name === series.name))
    .reduce((total, entry) => total + entry.usd, 0);
}

/** Graduation haute de l'axe : 2, 4, 8, 10, 20… au-dessus du jour le plus cher. */
export function axisMax(values: readonly number[]): number {
  const max = Math.max(0, ...values);
  if (max === 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 4, 5, 8, 10].find((candidate) => candidate * magnitude >= max) ?? 10;
  return step * magnitude;
}
