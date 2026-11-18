import type { FolderListingDto } from '@bosco/domain';

/** Dossier coché dans le navigateur, gardé d'un dossier à l'autre. */
export interface ChosenFolder {
  git: boolean;
  name: string;
  path: string;
}

/** Coche ou décoche un dossier. */
export function toggleFolder(chosen: readonly ChosenFolder[], folder: ChosenFolder): ChosenFolder[] {
  return chosen.some(({ path }) => path === folder.path)
    ? chosen.filter(({ path }) => path !== folder.path)
    : [...chosen, folder];
}

/** Dépôts git du dossier ouvert qui ne sont ni des projets ni déjà cochés. */
export function gitToCheck(listing: FolderListingDto, chosen: readonly ChosenFolder[]): ChosenFolder[] {
  const checked = new Set(chosen.map(({ path }) => path));
  return listing.folders
    .filter(({ added, git, path }) => git && !added && !checked.has(path))
    .map(({ git, name, path }) => ({ git, name, path }));
}

/** « Cocher les 2 dépôts git non ajoutés de ce dossier » */
export function checkGitLabel(count: number): string {
  return count > 1
    ? `Cocher les ${count} dépôts git non ajoutés de ce dossier`
    : 'Cocher le dépôt git non ajouté de ce dossier';
}

/** « Ajouter 2 projets » */
export function addLabel(count: number): string {
  return count > 1 ? `Ajouter ${count} projets` : `Ajouter ${count} projet`;
}

/** « 2 dossiers cochés » */
export function checkedLabel(count: number): string {
  return count > 1 ? `${count} dossiers cochés` : `${count} dossier coché`;
}

export function sessionsLabel(count: number): string {
  return `${count} ${count > 1 ? 'sessions' : 'session'}`;
}
