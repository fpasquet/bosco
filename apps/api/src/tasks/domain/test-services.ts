/** Service du fichier des services de test d'un dépôt, réduit aux options gardées (RF-CONT-08). */
export interface TestService {
  command: null | string[];
  entrypoint: null | string[];
  environment: Record<string, string>;
  /** Commande de vérification de l'état du service, lancée dans son conteneur ; null sans vérification */
  healthcheck: null | { command: string; interval: null | string; retries: null | number; timeout: null | string };
  image: null | string;
  name: string;
  /** Options du fichier retirées par sécurité, en clair (« ports publiés ») */
  removed: string[];
}

export type TestServicesMode = 'auto' | 'choose' | 'none';

/** Réglage d'un dépôt (E12a) : quels services lancer, et l'image de l'agent (null : l'image par défaut). */
export interface TestEnvironment {
  image: null | string;
  mode: TestServicesMode;
  selected: string[];
}

export const DEFAULT_ENVIRONMENT: TestEnvironment = { image: null, mode: 'auto', selected: [] };

/** Images qui servent à lancer l'application, pas à la tester. */
const EXCLUDED_IMAGES = [/^(docker\.io\/)?(library\/)?node(:|$)/];

export interface TestServicesPlan {
  /** Écartés, avec la raison : l'application elle-même, une image exclue, ou non cochée */
  excluded: { name: string; reason: string }[];
  launched: TestService[];
  /** Options retirées, tous services confondus */
  removed: string[];
}

/** Pourquoi un service n'est jamais lancé, quel que soit le choix : null s'il peut l'être. */
function ineligible(service: TestService): null | string {
  if (!service.image) return 'c’est l’application elle-même';
  if (EXCLUDED_IMAGES.some((pattern) => pattern.test(service.image ?? ''))) return 'sert à lancer l’application';
  return null;
}

/**
 * Ce qui est lancé autour de l'agent (CA-CONT-50) : « Automatique » lance tout service qui a une image, sauf
 * l'application et les images exclues ; « Choisir », seulement les services cochés ; « Aucun », rien.
 */
export function planOf(services: readonly TestService[], environment: TestEnvironment): TestServicesPlan {
  const plan: TestServicesPlan = { launched: [], excluded: [], removed: [] };
  if (environment.mode === 'none') return plan;
  for (const service of services) {
    const reason = ineligible(service);
    if (reason) plan.excluded.push({ name: service.name, reason });
    else if (environment.mode === 'choose' && !environment.selected.includes(service.name))
      plan.excluded.push({ name: service.name, reason: 'non coché' });
    else plan.launched.push(service);
  }
  plan.removed = [...new Set(plan.launched.flatMap((service) => service.removed))];
  return plan;
}

/** Nom d'image acceptable : registre, chemin et étiquette, sans option ni espace. */
export function isImage(value: string): boolean {
  return /^[a-z0-9][a-z0-9._/-]*(:[\w.-]+)?(@sha256:[a-f0-9]{64})?$/i.test(value.trim());
}

/** Lancement d'un service autour de l'agent : prêt après tant de secondes, ou la raison de l'échec. */
export interface ServiceLaunch {
  error: null | string;
  image: string;
  name: string;
  readySeconds: null | number;
}

/** Limites de chaque service de test (E12a), et attente au plus avant de continuer sans eux. */
export const SERVICE_LIMITS = { memory: 1024 ** 3, cpus: 1, waitSeconds: 180 } as const;

/** Ce que l'agent apprend des services de test, ajouté à sa consigne (CA-CONT-52, CA-CONT-53). */
export function servicesNote(launches: readonly ServiceLaunch[]): null | string {
  if (launches.length === 0) return null;
  const failed = launches.filter((launch) => launch.error);
  if (failed.length > 0)
    return `Les services de test n’ont pas démarré (${failed
      .map((launch) => `${launch.name} : ${launch.error}`)
      .join(', ')}) : travaille sans eux, et dis-le dans ton compte rendu.`;
  return `Services de test joignables par leur nom, sur un réseau privé sans Internet : ${launches
    .map((launch) => `${launch.name} (${launch.image})`)
    .join(', ')}.`;
}
