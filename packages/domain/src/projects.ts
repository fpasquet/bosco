/** Un projet : un dossier ajouté par la personne, avec l'activité de ses sessions. */
export interface ProjectDto {
  git: boolean;
  id: number;
  /** Dernière activité de ses sessions ; null sans session */
  lastSessionAt: null | string;
  name: string;
  path: string;
  pinned: boolean;
  sessions: number;
}

/** Dossier où une session a tourné hors des projets, proposé pour en devenir un. */
export interface FolderSuggestionDto {
  git: boolean;
  lastSessionAt: string;
  name: string;
  path: string;
  /** Coché d'office quand aucun projet n'existe : un dépôt git dont une session a moins de 7 jours */
  preselected: boolean;
  sessions: number;
}

/** Tous les projets : les projets, les sessions hors projet et les dossiers proposés, ignorés à part. */
export interface ProjectsDto {
  /** Dossier personnel, pour écrire les chemins comme dans le terminal (« ~/www ») */
  home: string;
  ignored: FolderSuggestionDto[];
  /** Sessions hors de tout projet */
  outside: number;
  projects: ProjectDto[];
  suggestions: FolderSuggestionDto[];
}

/** Un dossier ouvert dans le navigateur de dossiers : ses sous-dossiers, par leur nom. */
export interface FolderListingDto {
  /** Du dossier personnel (« ~ ») au dossier ouvert */
  crumbs: { name: string; path: string }[];
  folders: { added: boolean; git: boolean; name: string; path: string; suggestion: boolean }[];
  home: string;
  /** null au dossier personnel, d'où l'on ne remonte pas */
  parent: null | string;
  path: string;
}
