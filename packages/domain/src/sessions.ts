/** Vues des sessions et des profils, telles que l'API les renvoie en JSON (dates en ISO 8601). */

export interface ProfileCandidateDto {
  lastSessionAt: null | string;
  path: string;
  repositoryCount: number;
}

export interface SourceDto {
  id: string;
  label: string;
  liveTracking: boolean;
  path: string;
  watched: boolean;
}

export interface SourcesDto {
  /** Dossiers trouvés sur le poste, proposés tant qu'aucun profil n'est choisi (premier lancement) */
  candidates: ProfileCandidateDto[];
  /** Dossier personnel, pour écrire les chemins comme le terminal (~/.claude) */
  home: string;
  sources: SourceDto[];
}

export type SessionStateDto = 'inactive' | 'running';

export interface SessionDto {
  branch: null | string;
  id: string;
  lastEventAt: string;
  lastMessage: null | string;
  model: null | string;
  repoPath: null | string;
  sourceId: string;
  startedAt: string;
  state: SessionStateDto;
  title: null | string;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
}
