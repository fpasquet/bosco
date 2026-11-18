// Services de données d'un projet dans son bac à sable : ceux de son fichier Compose qui tournent sur une image toute
// faite, sans construire ni monter le dépôt (une base, un cache, une file). Ils démarrent sur le réseau privé du bac à
// sable, sans port publié sur le poste, avec des volumes propres à la session, et l'agent les joint par leur nom.

/** Un volume d'un service tel que Compose le décrit, en forme longue ou courte (« données:/var/lib/postgresql/data ») */
type ComposeVolume = string | { read_only?: boolean; source?: string; target?: string; type?: string };

/** Un service du fichier Compose, réduit à ce que Bosco lit */
export interface ComposeService {
  build?: unknown;
  cap_add?: unknown[];
  command?: unknown;
  devices?: unknown[];
  entrypoint?: unknown;
  environment?: Record<string, null | number | string> | string[];
  healthcheck?: unknown;
  image?: string;
  ipc?: string;
  network_mode?: string;
  pid?: string;
  privileged?: boolean;
  shm_size?: number | string;
  tmpfs?: string | string[];
  user?: string;
  volumes?: ComposeVolume[];
  working_dir?: string;
}

export interface ComposeConfig {
  services?: Record<string, ComposeService | null>;
}

/** Un service de données retenu : son nom (celui que l'agent joint) et son image */
export interface DataService {
  image: string;
  name: string;
}

/** Plafonds de chaque service de données, plus bas que ceux de l'agent */
export const SERVICE_LIMITS = { cpus: 1, memory: 1024 ** 3, processes: 256 } as const;

/** Fichiers Compose cherchés à la racine du projet, dans l'ordre de Docker Compose */
export const COMPOSE_FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'] as const;

interface Volume {
  readOnly: boolean;
  source: null | string;
  target: string;
  type: 'bind' | 'tmpfs' | 'volume';
}

/** « ./data:/data:ro » ou la forme longue → type, source et cible ; un chemin en source est un montage du poste. */
function volumeOf(entry: ComposeVolume): null | Volume {
  if (typeof entry === 'string') {
    const [first = '', second, third] = entry.split(':');
    if (second === undefined) return { readOnly: false, source: null, target: first, type: 'volume' };
    const bind = /^[./~]/.test(first);
    return { readOnly: third === 'ro', source: first, target: second, type: bind ? 'bind' : 'volume' };
  }
  if (!entry.target) return null;
  // Un type inconnu (npipe, cluster) compte comme un montage du poste : le service reste hors du bac à sable
  const type = entry.type === 'tmpfs' || entry.type === 'volume' ? entry.type : 'bind';
  return { readOnly: entry.read_only === true, source: entry.source ?? null, target: entry.target, type };
}

/**
 * Pourquoi un service ne démarre pas avec le bac à sable ; null s'il est un service de données. Construire une image,
 * monter un dossier du poste ou prendre des droits du poste en écartent.
 */
export function skippedBecause(service: ComposeService): null | string {
  if (service.build !== undefined) return 'construit depuis le dépôt';
  if (!service.image) return 'sans image';
  const volumes = (service.volumes ?? []).map((entry) => volumeOf(entry));
  if (volumes.some((volume) => volume === null || volume.type === 'bind')) return 'monte un dossier du poste';
  if (service.privileged || (service.cap_add?.length ?? 0) > 0 || (service.devices?.length ?? 0) > 0)
    return 'demande des droits du poste';
  if ([service.network_mode, service.pid, service.ipc].some((mode) => mode === 'host' || mode?.startsWith('service:')))
    return 'partage le réseau ou les processus du poste';
  return null;
}

/** Les services de données du projet, dans l'ordre du fichier. */
export function dataServicesOf(config: ComposeConfig): DataService[] {
  return Object.entries(config.services ?? {}).flatMap(([name, service]) =>
    service && service.image && skippedBecause(service) === null ? [{ image: service.image, name }] : [],
  );
}

/** Variables d'un service, en tableau ou en objet ; une variable sans valeur (prise du poste) n'est pas transmise. */
function environmentOf(environment: ComposeService['environment']): Record<string, string> {
  if (!environment) return {};
  const entries = Array.isArray(environment)
    ? environment.flatMap((line) => {
        const at = line.indexOf('=');
        return at === -1 ? [] : [[line.slice(0, at), line.slice(at + 1)] as const];
      })
    : Object.entries(environment).flatMap(([key, value]) => (value === null ? [] : [[key, String(value)] as const]));
  return Object.fromEntries(entries);
}

/**
 * Fichier Compose des services de données d'un bac à sable : son projet, `bosco-s-<clé>`, ses services sur le réseau
 * privé du bac à sable (joints par leur nom), ses volumes nommés propres à la session, jamais ceux du poste. Ni port
 * publié, ni nom de conteneur, ni redémarrage : seuls l'image, la commande, les variables, le contrôle de santé et les
 * volumes du projet sont repris, avec les plafonds de Bosco.
 */
export function sandboxCompose(
  config: ComposeConfig,
  sandbox: { key: string; network: string },
): { file: Record<string, unknown>; services: DataService[] } {
  const services = dataServicesOf(config);
  const volumes = new Set<string>();
  const described = Object.fromEntries(
    services.map(({ image, name }) => {
      const service = config.services?.[name] ?? {};
      const mounts = (service.volumes ?? []).flatMap((entry) => {
        const volume = volumeOf(entry);
        if (!volume) return [];
        if (volume.type === 'tmpfs') return [{ type: 'tmpfs', target: volume.target }];
        if (volume.source) volumes.add(volume.source);
        return [
          {
            type: 'volume',
            ...(volume.source ? { source: volume.source } : {}),
            target: volume.target,
            read_only: volume.readOnly,
          },
        ];
      });
      const kept = {
        command: service.command,
        entrypoint: service.entrypoint,
        healthcheck: service.healthcheck,
        shm_size: service.shm_size,
        tmpfs: service.tmpfs,
        user: service.user,
        working_dir: service.working_dir,
      };
      return [
        name,
        {
          image,
          ...Object.fromEntries(Object.entries(kept).filter(([, value]) => value !== undefined && value !== null)),
          environment: environmentOf(service.environment),
          volumes: mounts,
          labels: { 'bosco.session': sandbox.key, 'bosco.service': name },
          networks: ['sandbox'],
          cpus: SERVICE_LIMITS.cpus,
          mem_limit: SERVICE_LIMITS.memory,
          pids_limit: SERVICE_LIMITS.processes,
          security_opt: ['no-new-privileges:true'],
        },
      ];
    }),
  );
  return {
    services,
    file: {
      name: `bosco-s-${sandbox.key}`,
      services: described,
      networks: { sandbox: { name: sandbox.network, external: true } },
      // Sans nom : Compose les préfixe du projet du bac à sable, jamais un volume du poste ni d'un autre bac à sable
      volumes: Object.fromEntries([...volumes].map((volume) => [volume, {}])),
    },
  };
}
