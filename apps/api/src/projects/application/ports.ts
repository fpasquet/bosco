import type { DiscoverySettings } from '../domain/discovered-import.ts';
import type { FolderEntry } from '../domain/folder.ts';
import type { Group } from '../domain/group.ts';
import type { SessionFolder } from '../domain/placement.ts';
import type { Project } from '../domain/project.ts';
import type { RetiredSocle, RetiredSocleDecision } from '../domain/socle-import.ts';

export type { GitOrigins, SessionFolder } from '../domain/placement.ts';

export interface ProjectRepository {
  list(): Promise<Project[]>;
  nextId(): Promise<number>;
  remove(id: number): Promise<void>;
  save(projects: readonly Project[]): Promise<void>;
}

export interface GroupRepository {
  list(): Promise<Group[]>;
  nextId(): Promise<number>;
  remove(id: number): Promise<void>;
  save(groups: readonly Group[]): Promise<void>;
}

/** Dossiers proposés que la personne a choisi d'ignorer. */
export interface IgnoredFolders {
  ignore(path: string, at: Date): Promise<void>;
  list(): Promise<string[]>;
  restore(paths: readonly string[]): Promise<void>;
}

/** Dossiers du poste, lus sans rien modifier. */
export interface Folders {
  /** Le dossier existe : est-ce un dépôt git ? null quand ce n'est pas un dossier */
  inspect(path: string): Promise<null | { git: boolean }>;
  /** Ce que contient un dossier, sans rien lire des fichiers */
  list(path: string): Promise<FolderEntry[]>;
  /** Chemin réel, liens symboliques suivis ; null quand il n'existe pas */
  realPath(path: string): Promise<null | string>;
}

/** Branche courante d'un dépôt, lue dans git sans rien y changer. */
export interface Branches {
  /** null hors de git ou sur un commit détaché */
  currentOf(path: string): Promise<null | string>;
}

/** Sessions pilotées par Bosco qui tournent encore, branchées par le point de composition. */
export interface RunningSessions {
  /** Sessions pilotées dont un tour ou le bac à sable tourne dans ce projet */
  countIn(projectId: number): Promise<number>;
}

/** Dossiers de travail des sessions déjà lues, branchés par le point de composition. */
export interface SessionFolders {
  list(): Promise<SessionFolder[]>;
}

/** Réglages de l'ancienne découverte, tant que les dépôts découverts n'ont pas été repris comme projets. */
export interface DiscoveryToImport {
  /** null quand la reprise est déjà faite (ou que la base est neuve) */
  pending(): Promise<null | Partial<DiscoverySettings>>;
  settle(): Promise<void>;
}

/** Socles d'avant les groupes, tant qu'ils n'ont pas été repris en groupes. */
export interface SoclesToImport {
  /** null quand la reprise est déjà faite (ou que la base est neuve) */
  pending(): Promise<null | { decisions: RetiredSocleDecision[]; socles: RetiredSocle[] }>;
  settle(): Promise<void>;
}

export interface Clock {
  now(): Date;
}
