import { DomainError } from '../../shared/domain/domain-error.ts';

export class InvalidFolder extends DomainError {
  constructor(raw: string) {
    super('invalidFolder', `"${raw}" is not an absolute folder path`);
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
