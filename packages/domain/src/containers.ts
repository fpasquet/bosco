// Conteneurs en cours (E19, E13d) : ce que Bosco fait tourner et ce que chacun consomme (GET /api/containers).

/** Consommation d'un élément : processeur en cœurs, mémoire en octets, rapportés à son plafond (null : sans plafond) */
export interface UsageDto {
  cpu: number;
  cpuLimit: null | number;
  memory: number;
  memoryLimit: null | number;
}

/** Un service de test d'une tâche (E19a) ; « restarting » pendant un redémarrage, « failed » s'il n'a pas répondu */
export interface RunningServiceDto extends UsageDto {
  image: string;
  /** Nom du conteneur, pour les actions */
  name: string;
  service: string;
  state: 'failed' | 'restarting' | 'running';
}

/** L'agent d'une tâche du worker, et les services de test qu'elle a lancés (E19a) */
export interface RunningAgentDto extends UsageDto {
  name: string;
  repository: string;
  services: RunningServiceDto[];
  taskId: number;
  title: string;
}

/** Une session pilotée dont un tour est en cours : elle tourne sur le poste, sans plafond (E19a) */
export interface PilotedTurnDto extends UsageDto {
  sessionId: string;
  since: string;
  title: string;
}

/** Un conteneur resté après la fin de sa tâche (E19d) : arrêté ou non, il ne compte que pour le disque */
export interface LeftoverContainerDto {
  image: string;
  kind: 'agent' | 'proxy' | 'service';
  name: string;
  running: boolean;
  service: null | string;
  taskId: number;
  /** null si la tâche n'existe plus */
  task: null | { endedAt: string; state: string; title: string };
}

export interface ContainersDto {
  agents: RunningAgentDto[];
  /** Capacité du worker (E11a) : ce qui décide si la prochaine tâche part */
  capacity: { availableMemory: number; maxAgents: number; reservedMemory: number; running: number };
  /** Cœurs du poste */
  hostCpus: number;
  leftovers: LeftoverContainerDto[];
  /** Place prise sur le disque par les conteneurs restés, en octets */
  leftoversDisk: number;
  /** Heure de la dernière mesure ; null avant la première */
  measuredAt: null | string;
  /** Prochaine suppression automatique des conteneurs restés */
  nextCleanupAt: null | string;
  piloted: PilotedTurnDto[];
  /** Totaux de ce qui tourne, sans les conteneurs restés (CA-CONT-85) */
  totals: { agents: number; cpu: number; memory: number; piloted: number; services: number };
  /** Depuis quand Docker ne répond pas ; null s'il répond (E19c) */
  unreachableSince: null | string;
}
