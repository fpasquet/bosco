/** Mise en forme des données de Bosco : chemins comme dans le terminal, tailles et dates en français. */

/** Chemin écrit comme dans le terminal : le dossier personnel devient ~. */
export function displayPath(path: string, home: string): string {
  if (path === home) return '~';
  return home && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

const UNITS = ['octets', 'Ko', 'Mo', 'Go', 'To'];

/** Taille en unités de 1 024, une décimale au-delà du kilo-octet : « 48,2 Mo ». */
export function fileSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  if (unit === 0) return `${bytes} ${bytes > 1 ? 'octets' : 'octet'}`;
  return `${value.toLocaleString('fr', { maximumFractionDigits: 1 })} ${UNITS[unit]}`;
}

const DATE = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', year: 'numeric' });

/** Date courte : « 8 oct. 2026 ». */
export function shortDate(iso: string): string {
  return DATE.format(new Date(iso));
}

/** Nombre suivi de son nom, au singulier ou au pluriel : « 1 session », « 214 sessions ». */
export function count(value: number, singular: string, plural = `${singular}s`): string {
  return `${value.toLocaleString('fr')} ${value > 1 ? plural : singular}`;
}

/** Liste lue d'un trait : « pro », « pro et perso », « pro, perso et clients ». */
export function names(values: readonly string[]): string {
  if (values.length <= 1) return values.join('');
  return `${values.slice(0, -1).join(', ')} et ${values.at(-1)}`;
}

/** Le mot de la réinitialisation, sans majuscules ni accents : « reinitialiser » vaut « RÉINITIALISER ». */
export function isResetWord(word: string): boolean {
  const normalized = word
    .trim()
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
  return normalized === 'reinitialiser';
}
