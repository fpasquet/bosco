// Une instance de Bosco par processus de test : port, dossier Claude Code et enregistrements propres.
import { type ChildProcess, spawn } from 'node:child_process';
import { once } from 'node:events';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export interface StreamEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface Bosco {
  url: string;
  /** Adresse HTTPS du téléphone, ouverte seulement quand l'accès est activé (E4c) */
  phoneUrl: string;
  configDir: string;
  /** Secret de l'installation, exigé par l'entrée des hooks et le serveur MCP */
  secret(): string;
  /** Dossier où Bosco cherche les profils de Claude Code (~ du poste pendant les scénarios) */
  profilesRoot: string;
  reset(): Promise<void>;
  /** Écrit le transcript d'une session dans un profil, comme le ferait Claude Code ; renvoie son chemin. */
  writeProfileTranscript(profile: string, source: string, sessionId: string): string;
  /** Écrit un transcript d'exemple comme le ferait Claude Code (chemin absolu du fichier source). */
  writeTranscript(source: string, sessionId: string): void;
  /** Ouvre le flux SSE et garde chaque événement reçu. */
  subscribe(): { events: StreamEvent[]; close(): void };
  stop(): Promise<void>;
}

async function freePort(): Promise<number> {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  server.close();
  if (!address || typeof address === 'string') throw new Error('No free port');
  return address.port;
}

/** Dossiers personnels des scénarios : hors de /tmp, exclu des dépôts par défaut, et hors de tout dépôt git. */
const HOMES = join(homedir(), '.cache', 'bosco-e2e');

/** Dossier personnel écrit dans les transcripts d'exemple, remplacé par le dossier du scénario. */
const SAMPLE_HOME = '/home/dev';

/** `recordings` : dossier des enregistrements des appels sortants de cette suite. */
export async function startBosco(recordings: string): Promise<Bosco> {
  const port = await freePort();
  const phonePort = await freePort();
  const configDir = mkdtempSync(join(tmpdir(), 'bosco-claude-'));
  const dataDir = mkdtempSync(join(tmpdir(), 'bosco-data-'));
  // Dossier personnel du scénario hors de /tmp, que Bosco exclut des dépôts par défaut (CA-SESS-79)
  mkdirSync(HOMES, { recursive: true });
  const profilesRoot = mkdtempSync(join(HOMES, 'bosco-home-'));
  const url = `http://127.0.0.1:${port}`;
  const child: ChildProcess = spawn(
    process.execPath,
    ['--import', pathToFileURL(join(ROOT, 'e2e/replay/register.ts')).href, 'apps/api/dist/main.js'],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        BOSCO_PORT: String(port),
        BOSCO_DATA_DIR: dataDir,
        BOSCO_WEB_DIR: join(ROOT, 'apps/web'),
        CLAUDE_CONFIG_DIR: configDir,
        BOSCO_PROFILES_ROOT: profilesRoot,
        // Le « réseau local » des scénarios est la boucle locale, sur un port à part
        BOSCO_PHONE_HOST: '127.0.0.1',
        BOSCO_PHONE_PORT: String(phonePort),
        BOSCO_TEST: '1',
        BOSCO_REPLAY: process.env.BOSCO_REPLAY ?? 'replay',
        BOSCO_RECORDINGS: recordings,
      },
      stdio: ['ignore', 'inherit', 'inherit'],
    },
  );
  for (let attempt = 0; ; attempt++) {
    try {
      if ((await fetch(`${url}/api/health`)).ok) break;
    } catch {
      if (attempt > 80) throw new Error('Bosco did not start');
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return {
    url,
    phoneUrl: `https://127.0.0.1:${phonePort}`,
    secret: () => readFileSync(join(dataDir, 'hooks.secret'), 'utf8').trim(),
    configDir,
    profilesRoot,
    async reset() {
      await fetch(`${url}/__test/reset`, { method: 'POST' });
      rmSync(join(configDir, 'projects'), { recursive: true, force: true });
      for (const entry of readdirSync(profilesRoot))
        rmSync(join(profilesRoot, entry), { recursive: true, force: true });
    },
    writeProfileTranscript(profile, source, sessionId) {
      // Les dossiers de travail (/home/dev/labo-ia/packages/rag) sont recréés dans le dossier du scénario, chaque dépôt
      // avec son .git, pour que Bosco trouve les dépôts comme sur le poste.
      const content = readFileSync(source, 'utf8').replaceAll(SAMPLE_HOME, profilesRoot);
      const cwd = /"cwd":\s*"([^"]+)"/.exec(content)?.[1] ?? profilesRoot;
      const repository = cwd.slice(profilesRoot.length + 1).split('/')[0];
      if (repository) mkdirSync(join(profilesRoot, repository, '.git'), { recursive: true });
      mkdirSync(cwd, { recursive: true });
      // Worktree de Claude Code (labo-ia/.claude/worktrees/fix-ui) : son .git est un fichier vers le dépôt d'origine
      const worktree = /^(.+)\/\.claude\/worktrees\/([^/]+)/.exec(cwd);
      if (worktree?.[1] && worktree[2]) {
        const gitdir = join(worktree[1], '.git', 'worktrees', worktree[2]);
        mkdirSync(gitdir, { recursive: true });
        writeFileSync(join(worktree[0], '.git'), `gitdir: ${gitdir}\n`);
      }
      // Dossier de dépôt nommé comme le fait Claude Code : le chemin de travail, / remplacés par -
      const dir = join(profilesRoot, profile, 'projects', cwd.replaceAll('/', '-'));
      mkdirSync(dir, { recursive: true });
      const file = join(dir, `${sessionId}.jsonl`);
      writeFileSync(file, content);
      // Les sous-agents d'un transcript d'exemple sont à côté de lui : <transcript>/subagents/agent-<id>.{jsonl,meta.json}
      const subagents = join(source.replace(/\.jsonl$/, ''), 'subagents');
      if (existsSync(subagents)) {
        const target = join(dir, sessionId, 'subagents');
        mkdirSync(target, { recursive: true });
        for (const name of readdirSync(subagents))
          writeFileSync(
            join(target, name),
            readFileSync(join(subagents, name), 'utf8').replaceAll(SAMPLE_HOME, profilesRoot),
          );
      }
      return file;
    },
    writeTranscript(source, sessionId) {
      const dir = join(configDir, 'projects', '-home-dev');
      mkdirSync(dir, { recursive: true });
      cpSync(source, join(dir, `${sessionId}.jsonl`));
    },
    subscribe() {
      const events: StreamEvent[] = [];
      const controller = new AbortController();
      void (async () => {
        try {
          const response = await fetch(`${url}/api/events`, { signal: controller.signal });
          const decoder = new TextDecoder();
          let buffer = '';
          for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
            buffer += decoder.decode(chunk, { stream: true });
            for (let end = buffer.indexOf('\n\n'); end >= 0; end = buffer.indexOf('\n\n')) {
              const block = buffer.slice(0, end);
              buffer = buffer.slice(end + 2);
              const type = /^event: (.*)$/m.exec(block)?.[1];
              const data = /^data: (.*)$/m.exec(block)?.[1];
              if (type && data) events.push({ type, data: JSON.parse(data) as Record<string, unknown> });
            }
          }
        } catch {
          // flux fermé à la fin du scénario
        }
      })();
      return { events, close: () => controller.abort() };
    },
    async stop() {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
      rmSync(configDir, { recursive: true, force: true });
      rmSync(dataDir, { recursive: true, force: true });
      rmSync(profilesRoot, { recursive: true, force: true });
    },
  };
}
