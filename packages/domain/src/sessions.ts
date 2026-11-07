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
  /** Coût estimé en dollars au tarif public des modèles ; unpriced : une part vient d'un modèle sans tarif connu */
  cost: { unpriced: boolean; usd: number };
  id: string;
  lastAction: null | string;
  lastEventAt: string;
  lastMessage: null | string;
  model: null | string;
  /** Trois dernières actions de l'agent, la plus récente en premier */
  recentActions: string[];
  repoPath: null | string;
  /** Dépôt : nom de la racine git et dossier de travail à l'intérieur (« labo-ia », « packages/bosco ») */
  repository: { folder: string; name: string; root: string } | null;
  sourceId: string;
  startedAt: string;
  state: SessionStateDto;
  title: null | string;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
}

/** Avancement de la première lecture de l'historique ; null quand elle est finie. */
export interface ImportProgressDto {
  read: number;
  total: number;
}

/** Événements du flux en direct (GET /api/events) : un instantané d'abord, puis les changements. */
export type LiveEventDto =
  | { data: { progress: ImportProgressDto | null }; type: 'import.progress' }
  | { data: { session: SessionDto }; type: 'session.updated' }
  | { data: { sessions: SessionDto[] }; type: 'sessions.snapshot' };
