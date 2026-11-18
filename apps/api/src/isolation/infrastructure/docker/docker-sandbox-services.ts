// Services de données d'un bac à sable par Docker Compose : le fichier Compose du projet est lu dans la copie de la
// session (`docker compose config`), réduit aux services de données, puis lancé sous le projet `bosco-s-<clé>` sur le
// réseau privé du bac à sable. Le démarrage attend leur contrôle de santé ; leur échec ne bloque pas le tour.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { COMPOSE_FILES, type ComposeConfig, sandboxCompose } from '../../domain/data-services.ts';
import { DOCKER } from './docker-isolation.ts';

const run = promisify(execFile);

/** Délai du démarrage des services, téléchargement des images compris */
const START_TIMEOUT_S = 300;

export type ServiceState = 'failed' | 'ready' | 'starting';

export interface ServiceStatus {
  /** Pourquoi le service ne tourne pas ; null s'il tourne */
  error: null | string;
  image: string;
  name: string;
  state: ServiceState;
}

/** Les services de données démarrés avec le bac à sable ; error : le fichier Compose ne se lit pas */
export interface SandboxServices {
  error: null | string;
  services: ServiceStatus[];
}

export const NO_SERVICES: SandboxServices = { error: null, services: [] };

/** Ce que Docker Compose dit d'un conteneur (`ps --format json`) */
interface ComposeEntry {
  ExitCode?: number;
  Health?: string;
  Service: string;
  State: string;
}

/** Environnement de la commande docker : rien du poste au-delà de ce qu'il lui faut pour joindre Docker */
const DOCKER_VARIABLES = new Set(['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG', 'XDG_RUNTIME_DIR']);

function dockerEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (!DOCKER_VARIABLES.has(key)) delete env[key];
  return env;
}

/** Dernière ligne utile de la sortie d'erreur de docker compose */
function reasonOf(error: unknown): string {
  const stderr = (error as { stderr?: string }).stderr ?? (error instanceof Error ? error.message : String(error));
  const lines = stderr
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return (lines.at(-1) ?? 'docker compose a échoué').slice(0, 300);
}

/** `docker compose ps --format json` : une ligne JSON par conteneur, ou un tableau selon la version */
export function composeEntriesOf(stdout: string): ComposeEntry[] {
  const text = stdout.trim();
  if (!text) return [];
  if (text.startsWith('[')) return JSON.parse(text) as ComposeEntry[];
  return text.split('\n').map((line) => JSON.parse(line) as ComposeEntry);
}

/** État d'un service d'après Docker Compose : prêt (et sain s'il se contrôle), en démarrage, ou arrêté en échec. */
export function stateOf(entry: ComposeEntry | undefined): { error: null | string; state: ServiceState } {
  if (!entry) return { error: 'Conteneur absent', state: 'failed' };
  if (entry.State !== 'running')
    return {
      error: `Arrêté (code ${entry.ExitCode ?? '?'})`,
      state: entry.State === 'created' ? 'starting' : 'failed',
    };
  if (entry.Health === 'unhealthy') return { error: 'Contrôle de santé en échec', state: 'failed' };
  if (entry.Health === 'starting') return { error: null, state: 'starting' };
  return { error: null, state: 'ready' };
}

export class DockerSandboxServices {
  private fileOf(dir: string): string {
    return join(dir, 'services', 'compose.json');
  }

  private projectOf(key: string): string {
    return `bosco-s-${key}`;
  }

  /** Le fichier Compose du projet, résolu par Docker Compose ; null sans fichier Compose à sa racine. */
  private async config(projectDir: string): Promise<ComposeConfig | null> {
    if (!COMPOSE_FILES.some((name) => existsSync(join(projectDir, name)))) return null;
    const { stdout } = await run(DOCKER, ['compose', 'config', '--format', 'json'], {
      cwd: projectDir,
      env: dockerEnv(),
      maxBuffer: 8 * 1024 * 1024,
    });
    return JSON.parse(stdout) as ComposeConfig;
  }

  /**
   * Premier démarrage : les services de données du projet, lus dans la copie de la session, rejoignent le réseau privé
   * du bac à sable. Un fichier Compose illisible ou un service qui ne démarre pas est dit, sans bloquer le tour.
   */
  async start(spec: { dir: string; key: string; network: string; projectDir: string }): Promise<SandboxServices> {
    let config: ComposeConfig | null;
    try {
      config = await this.config(spec.projectDir);
    } catch (error) {
      return { error: `Fichier Compose illisible : ${reasonOf(error)}`, services: [] };
    }
    if (!config) return NO_SERVICES;
    const { file, services } = sandboxCompose(config, { key: spec.key, network: spec.network });
    if (services.length === 0) return NO_SERVICES;
    await mkdir(join(spec.dir, 'services'), { recursive: true });
    await writeFile(this.fileOf(spec.dir), JSON.stringify(file, null, 2));
    return this.up(spec);
  }

  /** Bac à sable relancé : ses services repartent tels qu'au premier démarrage, avec leurs données. */
  async restart(spec: { dir: string; key: string }): Promise<SandboxServices> {
    if (!existsSync(this.fileOf(spec.dir))) return NO_SERVICES;
    return this.up(spec);
  }

  private async up(spec: { dir: string; key: string }): Promise<SandboxServices> {
    const compose = ['compose', '--project-name', this.projectOf(spec.key), '--file', this.fileOf(spec.dir)];
    const failure = await run(
      DOCKER,
      [...compose, 'up', '--detach', '--wait', '--wait-timeout', String(START_TIMEOUT_S), '--quiet-pull'],
      { env: dockerEnv(), timeout: (START_TIMEOUT_S + 60) * 1000, maxBuffer: 8 * 1024 * 1024 },
    ).then(
      () => null,
      (error: unknown) => reasonOf(error),
    );
    const listed = await run(DOCKER, [...compose, 'ps', '--all', '--format', 'json'], { env: dockerEnv() }).catch(
      () => ({ stdout: '' }),
    );
    const text = await readFile(this.fileOf(spec.dir), 'utf8');
    const described = JSON.parse(text) as ComposeConfig;
    const entries = composeEntriesOf(listed.stdout);
    const services = Object.entries(described.services ?? {}).map(([name, service]) => {
      const { error, state } = stateOf(entries.find((entry) => entry.Service === name));
      // Le message de docker compose dit souvent mieux pourquoi le service a échoué que son code de sortie
      return { error: state === 'failed' ? (failure ?? error) : null, image: service?.image ?? '', name, state };
    });
    return { error: null, services };
  }

  async stop(spec: { dir: string; key: string }): Promise<void> {
    if (!existsSync(this.fileOf(spec.dir))) return;
    await run(
      DOCKER,
      [
        'compose',
        '--project-name',
        this.projectOf(spec.key),
        '--file',
        this.fileOf(spec.dir),
        'stop',
        '--timeout',
        '5',
      ],
      { env: dockerEnv() },
    ).catch(() => undefined);
  }

  /** Les conteneurs et les volumes des services, effacés avec le bac à sable. */
  async remove(spec: { dir: string; key: string }): Promise<void> {
    const file = existsSync(this.fileOf(spec.dir)) ? ['--file', this.fileOf(spec.dir)] : [];
    await run(
      DOCKER,
      [
        'compose',
        '--project-name',
        this.projectOf(spec.key),
        ...file,
        'down',
        '--volumes',
        '--remove-orphans',
        '--timeout',
        '5',
      ],
      { env: dockerEnv() },
    ).catch(() => undefined);
  }
}
