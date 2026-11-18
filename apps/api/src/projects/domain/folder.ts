import { DomainError } from '../../shared/domain/domain-error.ts';

export class InvalidFolder extends DomainError {
  constructor(raw: string) {
    super('invalidFolder', `"${raw}" is not an absolute folder path`);
  }
}

/** Dossier que le navigateur ne montre pas : hors du dossier personnel, ou caché. */
export class FolderRefused extends DomainError {
  constructor(path: string) {
    super('folderRefused', `The folder ${path} cannot be browsed: only the visible folders of the home folder can`);
  }
}

export class FolderNotFound extends DomainError {
  constructor(path: string) {
    super('folderNotFound', `No folder ${path}`);
  }
}

export function isInside(path: string, folder: string): boolean {
  return path === folder || path.startsWith(folder === '/' ? '/' : `${folder}/`);
}

/** Chemin d'un dossier dans un autre (« packages/api ») ; vide pour le dossier lui-même. */
export function relativePath(path: string, folder: string): string {
  if (path === folder) return '';
  return path.slice(folder === '/' ? 1 : folder.length + 1);
}

/** Chemin absolu d'un dossier, écrit sans « / » final ni double « / », qui ne remonte jamais (..). */
export class FolderPath {
  private constructor(readonly value: string) {}

  static of(raw: string): FolderPath {
    const path = raw.trim().replaceAll(/\/{2,}/g, '/');
    if (!path.startsWith('/') || path.split('/').some((part) => part === '..' || part === '.'))
      throw new InvalidFolder(raw);
    return new FolderPath(path.length > 1 ? path.replace(/\/$/, '') : path);
  }

  /** Nom du dossier (« api-tarifs ») */
  get name(): string {
    return this.value.split('/').findLast(Boolean) ?? '/';
  }

  /** Nom du dossier parent, pour distinguer deux dossiers du même nom ; null à la racine */
  get parentName(): null | string {
    const parts = this.value.split('/').filter(Boolean);
    return parts.at(-2) ?? null;
  }
}

/** Dossier lu par le navigateur, tel que le système le donne. */
export interface FolderEntry {
  directory: boolean;
  git: boolean;
  name: string;
}

/**
 * Dossier que le navigateur peut ouvrir : le dossier personnel (par défaut) ou un dossier visible à l'intérieur. Les
 * dossiers cachés (« .ssh », « .config ») ne s'ouvrent pas, même par leur chemin, sauf pour choisir un dossier de
 * configuration de Claude Code (`hidden`), souvent caché (« ~/.claude-perso »).
 */
export function browsedFolder(raw: null | string, home: string, hidden = false): FolderPath {
  const folder = FolderPath.of(raw ?? home);
  if (!isInside(folder.value, home)) throw new FolderRefused(folder.value);
  if (
    !hidden &&
    relativePath(folder.value, home)
      .split('/')
      .some((part) => part.startsWith('.'))
  )
    throw new FolderRefused(folder.value);
  return folder;
}

/**
 * Sous-dossiers montrés : des dossiers seulement, jamais de fichiers, ni de dossiers cachés sauf `hidden`, dans
 * l'ordre des noms.
 */
export function visibleFolders(entries: readonly FolderEntry[], hidden = false): { git: boolean; name: string }[] {
  return entries
    .filter(({ directory, name }) => directory && (hidden || !name.startsWith('.')))
    .map(({ git, name }) => ({ git, name }))
    .toSorted((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) || a.name.localeCompare(b.name));
}

/** Fil d'Ariane d'un dossier depuis le dossier personnel, écrit « ~ ». */
export function crumbsOf(folder: FolderPath, home: string): { name: string; path: string }[] {
  const inside = relativePath(folder.value, home).split('/').filter(Boolean);
  const crumbs = [{ name: '~', path: home }];
  for (const name of inside) {
    const previous = crumbs.at(-1)?.path ?? home;
    crumbs.push({ name, path: previous === '/' ? `/${name}` : `${previous}/${name}` });
  }
  return crumbs;
}

/** Dossier parent dans le navigateur ; null au dossier personnel, d'où l'on ne remonte pas. */
export function parentOf(folder: FolderPath, home: string): null | string {
  return crumbsOf(folder, home).at(-2)?.path ?? null;
}
