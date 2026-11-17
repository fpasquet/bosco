import type { GitOrigins, SessionFolder } from './placement.ts';
import { isInside } from './folder.ts';

/**
 * Réglages de l'ancienne découverte des dépôts, tels que le poste les a gardés : ils ne servent plus qu'à reprendre
 * les dépôts affichés comme projets, une fois.
 */
export interface DiscoverySettings {
  attachWorktrees: boolean;
  excluded: string[];
  gitOnly: boolean;
  hidden: string[];
  roots: string[];
}

/** Réglages appliqués quand le poste n'en avait jamais changé aucun. */
export const DISCOVERY_DEFAULTS: DiscoverySettings = {
  attachWorktrees: true,
  excluded: ['/tmp'],
  gitOnly: true,
  hidden: [],
  roots: [],
};

/** Ce que devient la découverte : des projets (les plus récents d'abord) et des suggestions ignorées. */
export interface DiscoveredImport {
  ignored: string[];
  projects: { git: boolean; path: string }[];
}

function expandHome(path: string, home: string): string {
  if (path === '~') return home;
  return path.startsWith('~/') ? `${home}${path.slice(1)}` : path;
}

/** Dépôt découvert d'une session selon l'ancienne découverte ; null quand elle allait sous « Hors projet ». */
function discoveredRoot(
  session: SessionFolder,
  settings: DiscoverySettings,
  git: GitOrigins,
): null | { git: boolean; root: string } {
  const gitRoot = session.gitRoot ?? (session.path ? git.rootOf(session.path) : null);
  const workRoot = gitRoot ?? (settings.gitOnly ? null : session.path);
  if (!workRoot) return null;
  const root = gitRoot && settings.attachWorktrees ? (git.originOf(gitRoot) ?? gitRoot) : workRoot;
  if (settings.excluded.some((folder) => isInside(root, folder))) return null;
  if (settings.roots.length > 0 && !settings.roots.some((folder) => isInside(root, folder))) return null;
  return { git: gitRoot !== null, root };
}

/**
 * Rejoue l'ancienne découverte sur les sessions déjà lues : chaque dépôt découvert et affiché devient un projet, chaque
 * dépôt masqué une suggestion ignorée.
 */
export function importDiscovered(
  stored: null | Partial<DiscoverySettings>,
  sessions: readonly SessionFolder[],
  home: string,
  git: GitOrigins,
): DiscoveredImport {
  const merged = { ...DISCOVERY_DEFAULTS, ...stored };
  const settings = {
    ...merged,
    excluded: merged.excluded.map((folder) => expandHome(folder, home)),
    roots: merged.roots.map((folder) => expandHome(folder, home)),
  };
  const found = new Map<string, { git: boolean; lastEventAt: Date }>();
  for (const session of sessions) {
    const discovered = discoveredRoot(session, settings, git);
    if (!discovered) continue;
    const known = found.get(discovered.root);
    if (!known || known.lastEventAt < session.lastEventAt)
      found.set(discovered.root, { git: discovered.git, lastEventAt: session.lastEventAt });
  }
  const hidden = new Set(settings.hidden);
  const projects = [...found.entries()]
    .filter(([path]) => !hidden.has(path))
    .toSorted(([, a], [, b]) => b.lastEventAt.getTime() - a.lastEventAt.getTime())
    .map(([path, entry]) => ({ git: entry.git, path }));
  return { ignored: [...hidden], projects };
}
