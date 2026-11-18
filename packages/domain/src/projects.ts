import type { SessionDefaultsDto } from './sessions.ts';

/** Un projet : un dossier ajouté par la personne, avec l'activité de ses sessions. */
export interface ProjectDto {
  /** Valeurs par défaut de ses nouvelles sessions */
  defaults: SessionDefaultsDto;
  /** Domaines propres au projet, ajoutés à la liste générale pour ses bacs à sable */
  domains: string[];
  git: boolean;
  id: number;
  /** Dernière activité de ses sessions ; null sans session */
  lastSessionAt: null | string;
  /** Monodépôt (pnpm-workspace.yaml, workspaces, turbo.json, nx.json) : un seul projet, ses paquets en sous-dossiers */
  monorepo: boolean;
  name: string;
  path: string;
  /** Montré dans la barre latérale même sans session ouverte */
  pinned: boolean;
  /** Où tourne par défaut une nouvelle session : le dernier choix fait ; null avant le premier */
  place: null | ProjectPlaceDto;
  sessions: number;
  /** Branche que copie un bac à sable ; null : la branche courante */
  startBranch: null | string;
}

export type ProjectPlaceDto = 'sandbox' | 'workstation';

/** Page d'un projet : le projet, la branche courante de son dossier (null sans git) et ce qui empêche de le retirer. */
export interface ProjectDetailDto extends ProjectDto {
  branch: null | string;
  /** Sessions pilotées par Bosco qui tournent encore dans le projet : tant qu'il y en a, il ne se retire pas */
  running: number;
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
  /** Fichiers du dossier (noms seulement), quand on choisit un fichier : celui d'un jeton longue durée */
  files?: { name: string; path: string }[];
  folders: { added: boolean; git: boolean; name: string; path: string; suggestion: boolean }[];
  home: string;
  /** null au dossier personnel, d'où l'on ne remonte pas */
  parent: null | string;
  path: string;
}

/** Un groupe de projets ; « Tous les projets » (system) contient toujours tous les projets et n'a que des instructions. */
export interface GroupDto {
  /** Valeurs par défaut des sessions démarrées avec le groupe ; elles passent avant celles des projets */
  defaults: SessionDefaultsDto;
  description: null | string;
  id: number;
  /** Texte libre, une consigne par ligne, transmis aux agents de chacun de ses projets */
  instructions: string;
  name: string;
  /** Dans l'ordre : le premier est le projet principal */
  projects: { id: number; name: string }[];
  /** Montré dans la barre latérale */
  sidebar: boolean;
  system: boolean;
}

export interface GroupsDto {
  groups: GroupDto[];
}
