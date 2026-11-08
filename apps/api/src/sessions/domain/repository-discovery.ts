import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Réglages des dépôts découverts (E4d). Le dépôt d'une session se calcule à l'affichage (DT-27) : un réglage changé
 * vaut aussitôt, sans relire l'historique.
 */
export interface DiscoverySnapshot {
  /** Un worktree git se range avec son dépôt d'origine (CA-SESS-78) */
  attachWorktrees: boolean;
  /** Dossiers où aucun dépôt n'est retenu ; ils l'emportent sur les dossiers de dépôts (CA-SESS-79) */
  excluded: string[];
  /** Une session hors d'un dépôt git ne crée pas de dépôt (CA-SESS-77) */
  gitOnly: boolean;
  /** Racines des dépôts masqués des listes (CA-SESS-80) */
  hidden: string[];
  /** Seuls les dépôts sous ces dossiers sont retenus ; vide : tout le poste (CA-SESS-79) */
  roots: string[];
}

export const DEFAULT_DISCOVERY: DiscoverySnapshot = {
  attachWorktrees: true,
  excluded: ['/tmp'],
  gitOnly: true,
  hidden: [],
  roots: [],
};

/** Découverte de la première version : le dossier de travail d'une session hors git compte comme un dépôt. */
export const LEGACY_DISCOVERY: DiscoverySnapshot = {
  attachWorktrees: false,
  excluded: [],
  gitOnly: false,
  hidden: [],
  roots: [],
};

/** Dépôt d'une session : nom, racine, dossier de travail à l'intérieur, et ce que les listes en font. */
export interface RepositoryPlace {
  folder: string;
  /** La racine est celle d'un dépôt git (seuls ceux-là reçoivent des tâches, CA-SESS-81) */
  git: boolean;
  hidden: boolean;
  name: string;
  root: string;
}

export class InvalidFolder extends DomainError {
  constructor(message: string) {
    super('invalidSetting', message);
  }
}

/** Chemin d'un dossier tel qu'on l'écrit dans le terminal (« ~/www », « /tmp ») : absolu, sans « / » final. */
export function folderPath(raw: string): string {
  const path = raw.trim().replaceAll(/\/{2,}/g, '/');
  if (path !== '~' && !path.startsWith('/') && !path.startsWith('~/'))
    throw new InvalidFolder(`« ${raw.trim()} » n’est pas un chemin absolu : écris-le comme dans le terminal (~/www).`);
  if (path.split('/').some((part) => part === '..'))
    throw new InvalidFolder(`« ${raw.trim()} » ne doit pas remonter d’un dossier (..).`);
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

/** Chemin d'un dossier sur le poste : « ~ » remplacé par le dossier personnel. */
export function expandHome(path: string, home: string): string {
  if (path === '~') return home;
  return path.startsWith('~/') ? `${home}${path.slice(1)}` : path;
}

export function isInside(path: string, folder: string): boolean {
  return path === folder || path.startsWith(folder === '/' ? '/' : `${folder}/`);
}

/**
 * Range une session dans son dépôt d'après la racine git de son dossier de travail (notée à la lecture du transcript)
 * et les réglages : null quand elle va sous « Hors dépôt git ».
 */
export class RepositoryDiscovery {
  private readonly excluded: string[];
  private readonly roots: string[];

  constructor(
    private readonly settings: DiscoverySnapshot,
    home: string,
    /** Dépôt d'origine d'un worktree git, ou null pour un dépôt ordinaire */
    private readonly originOf: (root: string) => null | string,
  ) {
    this.excluded = settings.excluded.map((folder) => expandHome(folder, home));
    this.roots = settings.roots.map((folder) => expandHome(folder, home));
  }

  placeOf(gitRoot: null | string, path: null | string): null | RepositoryPlace {
    const workRoot = gitRoot ?? (this.settings.gitOnly ? null : path);
    if (!workRoot) return null;
    const root = gitRoot && this.settings.attachWorktrees ? (this.originOf(gitRoot) ?? gitRoot) : workRoot;
    if (this.excluded.some((folder) => isInside(root, folder))) return null;
    if (this.roots.length > 0 && !this.roots.some((folder) => isInside(root, folder))) return null;
    return {
      folder: path && path.startsWith(`${workRoot}/`) ? path.slice(workRoot.length + 1) : '',
      git: gitRoot !== null,
      hidden: this.settings.hidden.includes(root),
      name: root.split('/').findLast(Boolean) ?? root,
      root,
    };
  }
}
