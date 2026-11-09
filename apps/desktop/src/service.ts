// Le service Bosco que l'application du poste fait tourner, ou auquel elle se relie (E17b, CA-APPS-01, CA-APPS-04).
// Lancée depuis le dépôt, elle le fait tourner avec le Node du poste, comme `bosco start`. Installée par le paquet .deb,
// elle embarque le service construit, l'interface et Node 26 : elle ne dépend alors ni du dépôt ni du Node du poste.
import { type ChildProcess, execFile, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
/** Version de Node dont Bosco a besoin */
export const NODE_MAJOR = 26;

/** Numéro majeur d'une version de Node (« v26.13.0 » → 26). */
export function majorOf(version: string): number {
  return Number(/^v?(\d+)\./.exec(version.trim())?.[1] ?? 0);
}

/** Node du poste : BOSCO_NODE, puis nvm (la plus récente des 26), puis les emplacements usuels. */
export function nodeCandidates(home: string, env: NodeJS.ProcessEnv): string[] {
  const nvm = join(home, '.nvm', 'versions', 'node');
  const nvmNodes = existsSync(nvm)
    ? readdirSync(nvm)
        .filter((version) => majorOf(version) >= NODE_MAJOR)
        .toSorted((a, b) => b.localeCompare(a, 'en', { numeric: true }))
        .map((version) => join(nvm, version, 'bin', 'node'))
    : [];
  return [env.BOSCO_NODE, ...nvmNodes, '/usr/local/bin/node', '/usr/bin/node'].filter((path): path is string => !!path);
}

export async function findNode(home: string, env: NodeJS.ProcessEnv): Promise<null | string> {
  for (const candidate of nodeCandidates(home, env)) {
    if (!existsSync(candidate)) continue;
    try {
      const { stdout } = await run(candidate, ['--version']);
      if (majorOf(stdout) >= NODE_MAJOR) return candidate;
    } catch {
      // pas exécutable
    }
  }
  return null;
}

/** Ce que l'application fait tourner : le service, son interface, et le Node embarqué par le paquet. */
export type ServiceLayout = Readonly<{ apiMain: string; node: null | string; webDir: string }>;

/**
 * Installée par le paquet, le service est dans les ressources de l'application (resources/service, resources/node) ;
 * lancée depuis le dépôt, il est à côté d'elle (apps/api, apps/web) et tourne avec le Node du poste.
 */
export function serviceLayout(where: { appDir: string; packaged: boolean; resourcesPath: string }): ServiceLayout {
  if (where.packaged) {
    const service = join(where.resourcesPath, 'service', 'apps');
    return {
      apiMain: join(service, 'api', 'dist', 'main.js'),
      webDir: join(service, 'web'),
      node: join(where.resourcesPath, 'node', 'bin', 'node'),
    };
  }
  return {
    apiMain: join(where.appDir, '..', 'api', 'dist', 'main.js'),
    webDir: join(where.appDir, '..', 'web'),
    node: null,
  };
}

/** Le service répond-il ? */
export async function healthy(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function waitFor(check: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const ok = await check();
    if (ok) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

/** Démarre le service avec ce Node, sur son port, l'interface servie depuis son dossier. */
export function startService(options: { apiMain: string; node: string; port: number; webDir: string }): ChildProcess {
  return spawn(options.node, [options.apiMain], {
    env: { ...process.env, BOSCO_PORT: String(options.port), BOSCO_WEB_DIR: options.webDir },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
}

/** « Remplacer le service » : le service systemd de l'utilisateur s'arrête et ne démarre plus seul. */
export async function stopUserService(): Promise<void> {
  try {
    await run('systemctl', ['--user', 'disable', '--now', 'bosco']);
  } catch {
    // pas de service systemd (lancé à la main avec `bosco start`) : l'utilisateur l'arrête lui-même
  }
}
