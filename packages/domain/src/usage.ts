/** Tokens d'une journée ou d'un total, par sorte. */
export interface UsageTokensDto {
  cacheCreation: number;
  cacheRead: number;
  input: number;
  output: number;
}

/** Une journée du graphique de la page Usage : ses tokens et leur coût estimé (en dollars), par sorte. */
export interface UsageDayDto {
  cost: UsageTokensDto;
  date: string;
  tokens: UsageTokensDto;
}

/** Une ligne de la répartition (par projet, par modèle, par profil) : sa part du coût estimé. */
export interface UsageShareDto {
  /** Lignes regroupées dans « autres » */
  count?: number;
  key: string;
  /** Nom du projet ou du profil, identifiant du modèle (« claude-opus-5-5 ») */
  label: string;
  /** Projet de la ligne, qui filtre la page au clic ; null : « Hors projet » ou « autres » */
  projectId?: null | number;
  /** En % du coût estimé total ; une session à plusieurs projets compte pour chacun */
  share: number;
  /** null : modèle sans tarif connu (« non chiffré ») */
  usd: null | number;
}

/** Page Usage (GET /api/usage) : ce que consomment les sessions, d'après leurs transcripts. */
export interface UsageReportDto {
  activity: {
    agentWorkSeconds: number;
    pilotedSessions: number;
    pullRequests: number;
    retrievedBranches: number;
    sandboxes: number;
  };
  byModel: UsageShareDto[];
  byProfile: UsageShareDto[];
  byProject: UsageShareDto[];
  days: UsageDayDto[];
  /** Premier jour de la période (AAAA-MM-JJ) */
  from: string;
  /** Modèles de la période, que propose le filtre */
  models: string[];
  /** Premier jour dont l'usage est connu ; null sans aucun tour */
  since: null | string;
  tokens: UsageTokensDto & {
    /** Lecture du cache / (entrée + lecture du cache), en % */
    cacheReuse: number;
    costUsd: number;
    sessions: number;
    turns: number;
    /** Part des tours qui n'ont rien relu du cache, en % */
    turnsWithoutCacheRead: number;
    /** Modèles sans tarif connu, exclus du coût */
    unpricedModels: string[];
  };
}
