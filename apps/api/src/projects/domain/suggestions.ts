import type { ProjectPlacement, SessionFolder } from './placement.ts';

/** Une session de moins de 7 jours dans un dépôt git : le dossier est coché d'office quand aucun projet n'existe. */
const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

/** Dossier où une session a tourné hors des projets, proposé pour en devenir un. */
export interface Suggestion {
  git: boolean;
  ignored: boolean;
  lastSessionAt: Date;
  name: string;
  path: string;
  /** Coché d'office : un dépôt git dont une session est récente ; jamais un dossier sans git */
  preselected: boolean;
  sessions: number;
}

export interface ProjectActivity {
  lastSessionAt: Date;
  sessions: number;
}

/** Sessions rangées : par projet, hors projet, et les dossiers proposés, les plus actifs d'abord. */
export interface Activity {
  outside: number;
  projects: Map<number, ProjectActivity>;
  suggestions: Suggestion[];
}

export function activityOf(
  sessions: readonly SessionFolder[],
  placement: ProjectPlacement,
  ignored: ReadonlySet<string>,
  now: Date,
): Activity {
  const projects = new Map<number, ProjectActivity>();
  const folders = new Map<string, Omit<Suggestion, 'ignored' | 'name' | 'preselected'>>();
  let outside = 0;
  for (const { gitRoot, lastEventAt, path } of sessions) {
    const place = placement.placeOf(gitRoot, path);
    if (place) {
      const known = projects.get(place.id);
      projects.set(place.id, {
        lastSessionAt: known && known.lastSessionAt > lastEventAt ? known.lastSessionAt : lastEventAt,
        sessions: (known?.sessions ?? 0) + 1,
      });
      continue;
    }
    outside += 1;
    const folder = placement.suggestionOf(gitRoot, path);
    if (!folder) continue;
    const known = folders.get(folder.path);
    folders.set(folder.path, {
      git: folder.git,
      lastSessionAt: known && known.lastSessionAt > lastEventAt ? known.lastSessionAt : lastEventAt,
      path: folder.path,
      sessions: (known?.sessions ?? 0) + 1,
    });
  }
  const suggestions = [...folders.values()]
    .map((folder) => ({
      ...folder,
      ignored: ignored.has(folder.path),
      name: folder.path.split('/').findLast(Boolean) ?? '/',
      preselected: folder.git && now.getTime() - folder.lastSessionAt.getTime() < RECENT_MS,
    }))
    .toSorted(
      (a, b) =>
        b.sessions - a.sessions ||
        b.lastSessionAt.getTime() - a.lastSessionAt.getTime() ||
        a.name.localeCompare(b.name, 'fr'),
    );
  return { outside, projects, suggestions };
}
