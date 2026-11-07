/** Chemin écrit comme dans le terminal : le dossier personnel devient ~. */
export function displayPath(path: string, home: string): string {
  return home && (path === home || path.startsWith(`${home}/`)) ? `~${path.slice(home.length)}` : path;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];
const RELATIVE = new Intl.RelativeTimeFormat('fr', { numeric: 'always', style: 'short' });

/** « il y a 3 min », « il y a 40 s » : l'unité la plus grande qui tient. */
export function sinceNow(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const [unit, size] = UNITS.find(([, length]) => seconds >= length) ?? ['second', 1];
  return RELATIVE.format(-Math.floor(seconds / size), unit);
}

export function repositories(count: number): string {
  return `${count} ${count > 1 ? 'dépôts' : 'dépôt'}`;
}
