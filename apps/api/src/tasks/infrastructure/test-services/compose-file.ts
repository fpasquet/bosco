// Fichier des services de test d'un dépôt (format Compose), lu à la branche de départ (CA-CONT-49) et réduit aux
// options sûres : image, variables, commande et vérification d'état. Le reste est retiré et dit (CA-CONT-51).
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import type { TestService } from '../../domain/test-services.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);

export const COMPOSE_FILES = ['compose.yaml', 'compose.yml', 'docker-compose.yml', 'docker-compose.yaml'] as const;

/** Options retirées, avec leur nom en clair. */
const REMOVED: [string, string][] = [
  ['ports', 'ports publiés'],
  ['env_file', 'fichiers d’environnement'],
  ['privileged', 'droits étendus'],
  ['cap_add', 'droits étendus'],
  ['devices', 'droits étendus'],
  ['security_opt', 'droits étendus'],
  ['network_mode', 'réseau du poste'],
  ['pid', 'réseau du poste'],
  ['ipc', 'réseau du poste'],
  ['networks', 'réseaux du fichier'],
];

type Raw = Record<string, unknown>;

/** Valeur simple d'un champ (texte, nombre, booléen) ; vide pour le reste. */
function scalar(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

/** « ${MYSQL_PASSWORD:-secret} » prend sa valeur par défaut : les variables du poste ne sont jamais lues. */
function interpolate(value: string): string {
  return value.replaceAll(/\$\{(\w+)(?::?-([^}]*))?\}/g, (_, _name: string, fallback?: string) => fallback ?? '');
}

/** Découpe une commande écrite en une ligne, guillemets compris. */
function words(value: unknown): null | string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return null;
  return (value.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((word) => word.replace(/^(["'])(.*)\1$/, '$2'));
}

function environmentOf(value: unknown): Record<string, string> {
  if (Array.isArray(value))
    return Object.fromEntries(
      value.map(String).map((entry) => {
        const [key = '', ...rest] = entry.split('=');
        return [key, interpolate(rest.join('='))];
      }),
    );
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value as Raw).map(([key, entry]) => [key, interpolate(scalar(entry))]));
  return {};
}

function healthcheckOf(value: unknown): TestService['healthcheck'] {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Raw;
  if (raw.disable === true) return null;
  const test = raw.test;
  let command: null | string = null;
  if (typeof test === 'string') command = test;
  else if (Array.isArray(test)) {
    const [kind, ...rest] = test.map(String);
    if (kind === 'CMD-SHELL' || kind === 'CMD') command = rest.join(' ');
  }
  if (!command) return null;
  const text = (entry: unknown) => (typeof entry === 'string' ? entry : null);
  return {
    command: interpolate(command),
    interval: text(raw.interval),
    timeout: text(raw.timeout),
    retries: typeof raw.retries === 'number' ? raw.retries : null,
  };
}

function volumesRemoved(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((volume) => {
    const source = typeof volume === 'string' ? (volume.split(':')[0] ?? '') : scalar((volume as Raw).source);
    return /^[./~]/.test(source) ? 'dossiers du poste' : 'volumes nommés';
  });
}

/** Services du fichier, dans son ordre ; un fichier illisible n'en donne aucun. */
export function parseCompose(text: string): TestService[] {
  let document: unknown;
  try {
    document = parse(text);
  } catch {
    return [];
  }
  const services = (document as Raw | null)?.services;
  if (!services || typeof services !== 'object') return [];
  return Object.entries(services as Raw).map(([name, value]) => {
    const raw = (value ?? {}) as Raw;
    const removed = [
      ...REMOVED.filter(([key]) => key in raw).map(([, label]) => label),
      ...volumesRemoved(raw.volumes),
    ];
    return {
      name,
      image: typeof raw.image === 'string' ? interpolate(raw.image) : null,
      environment: environmentOf(raw.environment),
      command: words(raw.command),
      entrypoint: words(raw.entrypoint),
      healthcheck: healthcheckOf(raw.healthcheck),
      removed: [...new Set(removed)],
    };
  });
}

/** Le fichier lu, la branche où il a été lu ; file à null quand le dépôt n'en a pas. */
export interface ComposeRead {
  branch: null | string;
  content: null | string;
  file: null | string;
}

export interface ComposeSource {
  read(repositoryRoot: string): Promise<ComposeRead>;
}

async function git(cwd: string, ...args: string[]): Promise<null | string> {
  return run(GIT, args, { cwd, maxBuffer: 4 * 1024 * 1024 }).then(
    ({ stdout }) => stdout,
    () => null,
  );
}

/**
 * Lecture dans git, à la branche courante du dépôt de la personne ; jamais dans une branche d'agent : une tâche
 * non relue ne peut pas se donner des services en modifiant le fichier (CA-CONT-49).
 */
export class GitComposeSource implements ComposeSource {
  async read(repositoryRoot: string): Promise<ComposeRead> {
    const head = await git(repositoryRoot, 'rev-parse', '--abbrev-ref', 'HEAD');
    const current = head?.trim() ?? null;
    let branch = current;
    if (!current || current === 'HEAD' || current.startsWith('bosco/')) {
      branch = null;
      for (const candidate of ['develop', 'main', 'master'])
        if ((await git(repositoryRoot, 'rev-parse', '--verify', '--quiet', candidate)) !== null) {
          branch = candidate;
          break;
        }
    }
    if (!branch) return { branch: null, file: null, content: null };
    for (const file of COMPOSE_FILES) {
      const content = await git(repositoryRoot, 'show', `${branch}:${file}`);
      if (content !== null) return { branch, file, content };
    }
    return { branch, file: null, content: null };
  }
}

/** Scénarios (BOSCO_TEST=1) : le fichier du dossier du dépôt, sur une branche « main ». */
export class FileComposeSource implements ComposeSource {
  async read(repositoryRoot: string): Promise<ComposeRead> {
    for (const file of COMPOSE_FILES) {
      const content = await readFile(join(repositoryRoot, file), 'utf8').catch(() => null);
      if (content !== null) return { branch: 'main', file, content };
    }
    return { branch: 'main', file: null, content: null };
  }
}

/** Le fichier lu puis réduit : ce que reçoit l'environnement de test. */
export function servicesFile(source: ComposeSource) {
  return {
    read: async (repositoryRoot: string) => {
      const { branch, content, file } = await source.read(repositoryRoot);
      return { branch, file, services: content ? parseCompose(content) : [] };
    },
  };
}
