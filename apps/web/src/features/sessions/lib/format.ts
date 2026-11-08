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

const NBSP = ' ';

/** Durée compacte des colonnes d'activité : « 40 s », « 6 min », « 1 h 12 », « 3 j ». */
export function elapsed(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}${NBSP}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${NBSP}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return minutes % 60 ? `${hours}${NBSP}h${NBSP}${String(minutes % 60).padStart(2, '0')}` : `${hours}${NBSP}h`;
  return `${Math.floor(hours / 24)}${NBSP}j`;
}

const DOLLARS = new Intl.NumberFormat('fr', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** Coût estimé : « 1,84 $ » ; « non chiffré » quand le tarif du modèle n'est pas connu (RF-SESS-05). */
export function formatCost(cost: { unpriced: boolean; usd: number }): string {
  if (cost.unpriced && cost.usd === 0) return 'non chiffré';
  return `${DOLLARS.format(cost.usd)}${NBSP}$`;
}

/** Tokens arrondis : « 212 k », « 1,2 M ». */
export function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${Math.round(count / 1000)}${NBSP}k`;
  return `${new Intl.NumberFormat('fr', { maximumFractionDigits: 1 }).format(count / 1_000_000)}${NBSP}M`;
}

export function sessions(count: number): string {
  return `${count} ${count > 1 ? 'sessions' : 'session'}`;
}

const DAY = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long', weekday: 'long' });

/** « jeudi 6 novembre » */
export function dayLabel(now: Date): string {
  return DAY.format(now);
}

/** Verbes des outils de Claude Code, comme dans les maquettes ; Bash et les autres outils gardent leur nom. */
const ACTION_VERBS: Record<string, string> = {
  Edit: 'Modifie',
  Glob: 'Cherche',
  Grep: 'Cherche',
  MultiEdit: 'Modifie',
  Read: 'Lit',
  WebFetch: 'Consulte',
  WebSearch: 'Recherche',
  Write: 'Écrit',
};

/** « Read · src/indexer/pdf.ts » devient « Lit src/indexer/pdf.ts » ; « Bash · yarn test » reste tel quel. */
export function actionLabel(action: string): string {
  const [tool = '', ...rest] = action.split(' · ');
  const verb = ACTION_VERBS[tool];
  return verb ? [verb, rest.join(' · ')].filter(Boolean).join(' ') : action;
}

/** Chemin écrit depuis la racine du dépôt quand il y est : « src/indexer/pdf.ts ». */
export function relativePath(path: string, root: null | string | undefined): string {
  return root && path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

/** « Opus 5.5 » d'après « claude-opus-5-5 » ; un modèle inconnu reste tel quel. */
export function modelName(model: null | string): string {
  const match = model && /^claude-([a-z]+)-(\d+)-(\d+)/.exec(model);
  if (!match) return model ?? '—';
  const [, family = '', major, minor] = match;
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`;
}
