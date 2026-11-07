// Enregistrer, rejouer, nettoyer les appels sortants du processus (fetch natif de Node), sur les briques stables
// d'undici. Chargé seulement en test (node --import), le code de l'application n'en sait rien.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Agent, type Dispatcher, MockAgent, setGlobalDispatcher } from 'undici';

export type ReplayMode = 'replay' | 'record' | 'update' | 'clean';

export interface Recording {
  origin: string;
  method: string;
  path: string;
  requestBody?: unknown;
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface ReplayOptions {
  mode: ReplayMode;
  /** Dossier des enregistrements : un sous-dossier par hôte, un fichier JSON lisible par réponse. */
  dir: string;
  /** Valeurs secrètes à masquer à l'enregistrement (jetons lus dans l'environnement). */
  secrets?: string[];
}

const KEPT_HEADERS = ['content-type'];
const SECRET_PATTERNS = [/gh[pousr]_\w{8,}/g, /xox[abprs]-[A-Za-z0-9-]{8,}/g, /ATATT[A-Za-z0-9_-]{8,}/g];

const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};
const normalize = (body: unknown): string => JSON.stringify(typeof body === 'string' ? parse(body) : body);
const slug = (method: string, path: string): string =>
  `${method.toLowerCase()}${path.replace(/[^a-z0-9]+/gi, '-')}`.replace(/-$/, '');
const byNumber = (a: string, b: string): number => a.localeCompare(b, undefined, { numeric: true });

/** Masque les secrets connus et les formes de jetons courantes. */
export function anonymize(text: string, secrets: string[] = []): string {
  let result = text;
  for (const secret of secrets.filter(Boolean)) result = result.split(secret).join('***');
  for (const pattern of SECRET_PATTERNS) result = result.replace(pattern, '***');
  return result;
}

/** Fichiers d'enregistrement qui contiennent encore une forme de secret (contrôle de CI). */
export function findSecrets(dir: string): string[] {
  return listFiles(dir).filter((file) =>
    SECRET_PATTERNS.some((pattern) => new RegExp(pattern.source).test(readFileSync(file, 'utf8'))),
  );
}

function listFiles(dir: string): string[] {
  let hosts: string[];
  try {
    hosts = readdirSync(dir);
  } catch {
    return [];
  }
  return hosts.flatMap((host) =>
    readdirSync(join(dir, host))
      .filter((file) => file.endsWith('.json'))
      .sort(byNumber)
      .map((file) => join(dir, host, file)),
  );
}

interface Loaded {
  file: string;
  recording: Recording;
}

function load(dir: string): Loaded[] {
  return listFiles(dir).map((file) => ({
    file: relative(dir, file),
    recording: JSON.parse(readFileSync(file, 'utf8')) as Recording,
  }));
}

/** Enregistre chaque réponse réelle ; une réponse identique à la précédente pour la même requête n'est pas réécrite. */
function recordingAgent(options: ReplayOptions, onRecord: (file: string) => void): Dispatcher {
  const last = new Map<string, { n: number; body: string }>();
  return new Agent().compose((dispatch) => (opts, handler) => {
    const url = new URL(opts.path, opts.origin);
    const path = url.pathname + url.search;
    const requestBody = typeof opts.body === 'string' ? parse(anonymize(opts.body, options.secrets)) : undefined;
    const chunks: Buffer[] = [];
    let status = 0;
    let headers: Record<string, string> = {};
    return dispatch(opts, {
      ...handler,
      onResponseStart(controller, statusCode, responseHeaders, statusMessage) {
        status = statusCode;
        headers = Object.fromEntries(
          KEPT_HEADERS.filter((name) => responseHeaders[name]).map((name) => [name, String(responseHeaders[name])]),
        );
        return handler.onResponseStart?.(controller, statusCode, responseHeaders, statusMessage);
      },
      onResponseData(controller, chunk) {
        chunks.push(Buffer.from(chunk));
        return handler.onResponseData?.(controller, chunk);
      },
      onResponseEnd(controller, trailers) {
        const body = parse(anonymize(Buffer.concat(chunks).toString('utf8'), options.secrets));
        const suffix = requestBody === undefined ? '' : `-${hash(normalize(requestBody))}`;
        const key = `${url.host}/${slug(String(opts.method), path)}${suffix}`;
        const previous = last.get(key);
        if (!previous || previous.body !== normalize(body)) {
          const n = (previous?.n ?? 0) + 1;
          last.set(key, { n, body: normalize(body) });
          const file = `${key}.${n}.json`;
          mkdirSync(join(options.dir, url.host), { recursive: true });
          const recording: Recording = {
            origin: url.origin,
            method: String(opts.method),
            path,
            ...(requestBody === undefined ? {} : { requestBody }),
            status,
            headers,
            body,
          };
          writeFileSync(join(options.dir, file), `${JSON.stringify(recording, null, 2)}\n`);
          onRecord(file);
        }
        return handler.onResponseEnd?.(controller, trailers);
      },
    });
  });
}

function hash(text: string): string {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

export interface Replay {
  /** Fichiers rejoués ou enregistrés depuis le dernier démarrage. */
  used(): string[];
  /** Remet les suites de réponses au début (entre deux scénarios). */
  reset(): void;
}

/**
 * replay : tout vient des fichiers, une requête inconnue échoue.
 * record : rejoue l'existant, enregistre ce qui manque. update : réenregistre tout.
 * clean : comme replay ; la suppression des fichiers inutilisés se fait après tous les processus (cleanUnused).
 */
export function installReplay(options: ReplayOptions): Replay {
  if (options.mode === 'update') rmSync(options.dir, { recursive: true, force: true });
  const used = new Set<string>();
  const recording = options.mode === 'record' || options.mode === 'update';
  let agent: MockAgent;
  const build = (): void => {
    agent = new MockAgent(recording ? { agent: recordingAgent(options, (file) => used.add(file)) } : {});
    if (recording) agent.enableNetConnect();
    else agent.disableNetConnect();
    // Une suite par requête : chaque réponse une fois, dans l'ordre, puis la dernière indéfiniment
    const groups = new Map<string, Loaded[]>();
    for (const entry of options.mode === 'update' ? [] : load(options.dir)) {
      const key = `${entry.recording.origin} ${entry.recording.method} ${entry.recording.path} ${normalize(entry.recording.requestBody ?? null)}`;
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    for (const entries of groups.values()) {
      entries.forEach(({ file, recording: r }, index) => {
        const scope = agent
          .get(r.origin)
          .intercept({
            method: r.method,
            path: r.path,
            ...(r.requestBody === undefined
              ? {}
              : { body: (body: string) => normalize(body) === normalize(r.requestBody) }),
          })
          .reply(() => {
            used.add(file);
            return {
              statusCode: r.status,
              data: typeof r.body === 'string' ? r.body : JSON.stringify(r.body),
              responseOptions: { headers: r.headers },
            };
          });
        if (index === entries.length - 1) scope.persist();
      });
    }
    setGlobalDispatcher(agent);
  };
  build();
  return { used: () => [...used], reset: build };
}

/** Après tous les processus de test (mode clean) : supprime les fichiers qu'aucun n'a utilisés. */
export function cleanUnused(dir: string, usedFiles: Iterable<string>): string[] {
  const keep = new Set(usedFiles);
  const removed = listFiles(dir)
    .map((file) => relative(dir, file))
    .filter((file) => !keep.has(file));
  for (const file of removed) rmSync(join(dir, file));
  return removed;
}
