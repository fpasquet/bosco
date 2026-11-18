// Conteneurs en cours : les bacs à sable des sessions et les tours pilotés, et ce que chacun consomme
// (GET /api/containers).

/** Consommation d'un élément : processeur en cœurs, mémoire en octets, rapportés à son plafond (null : sans plafond) */
export interface UsageDto {
  cpu: number;
  cpuLimit: null | number;
  memory: number;
  memoryLimit: null | number;
}

/** Un service de données du projet (base, cache…), démarré avec son bac à sable, mesuré contre son propre plafond */
export interface RunningServiceDto extends UsageDto {
  image: string;
  /** Nom du service, sous lequel l'agent le joint (« db ») */
  name: string;
  since: null | string;
  state: 'failed' | 'ready' | 'starting';
}

/** Le bac à sable d'une session, démarré */
export interface RunningSandboxDto extends UsageDto {
  /** Nom du conteneur de l'agent */
  name: string;
  /** Projet principal de la session */
  project: null | string;
  services: RunningServiceDto[];
  /** Session du bac à sable ; null si Bosco ne la connaît plus */
  sessionId: null | string;
  /** Démarrage du conteneur de l'agent */
  since: null | string;
  title: string;
}

/** Une session pilotée dont un tour est en cours sur le poste, sans plafond */
export interface PilotedTurnDto extends UsageDto {
  sessionId: string;
  since: string;
  title: string;
}

export interface ContainersDto {
  /** Cœurs du poste */
  hostCpus: number;
  /** Heure de la dernière mesure ; null avant la première */
  measuredAt: null | string;
  piloted: PilotedTurnDto[];
  sandboxes: RunningSandboxDto[];
  totals: { cpu: number; memory: number; piloted: number; sandboxes: number };
  /** Depuis quand Docker ne répond pas ; null s'il répond */
  unreachableSince: null | string;
}
