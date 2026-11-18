// Vérification de compatibilité avec le Claude Code installé (NF-09, RQ-01, RQ-14) : le hook PermissionRequest
// reçoit la réponse de Bosco, autorisation comme refus avec motif, et SessionEnd termine la session ; avec l'attente
// des connecteurs, celui d'Atlassian est branché dès le démarrage (DT-36) ; le flux JSON d'un tour donne l'usage de
// l'abonnement (DT-39) ; un tour piloté par Bosco en « Approuver pour moi » (auto) puis en « Accès complet »
// (bypassPermissions) passe ses réglages et lance la commande sans demande (règle 17). À lancer à chaque nouvelle
// version de Claude Code avec `make claude-compat` : six sessions courtes sur Haiku, sur l'abonnement.
import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { ClaudeTurnRunner } from '../../apps/api/dist/sessions/infrastructure/claude-code/claude-turn-runner.js';
import { startBosco } from '../shared/bosco.ts';

const MODEL = 'claude-haiku-5-5';
const REASON = 'Motif de compatibilité 4217.';
const run = promisify(execFile);
/**
 * Sans les réglages de l'utilisateur : ceux du profil par défaut peuvent porter les hooks d'un autre Bosco (celui du
 * poste), qui garderait la demande d'autorisation pour lui. Seuls les hooks de ce Bosco de vérification s'appliquent.
 */
const ISOLATED = ['--setting-sources', 'project,local'];

interface Waiting {
  id: string;
  requestId: string;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${url} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Lance une session `claude -p` dans un projet jetable, avec les hooks de Bosco passés par --settings. */
function claude(prompt: string, settings: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      // Le Claude Code à vérifier est celui du PATH de la personne : c'est lui que ses sessions utilisent
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      'claude',
      [...ISOLATED, '-p', prompt, '--settings', settings, '--permission-mode', 'default', '--model', MODEL],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(output) : reject(new Error(`claude exited ${code}: ${output}`))));
  });
}

/** Outils et connecteurs de claude.ai au démarrage d'une session `claude -p`, lus dans son premier message. */
function startingTools(env: Record<string, string>, cwd: string): Promise<{ servers: string[]; tools: string[] }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      'claude',
      [
        ...ISOLATED,
        '-p',
        'Réponds OK.',
        '--output-format',
        'stream-json',
        '--verbose',
        '--max-turns',
        '1',
        '--model',
        MODEL,
      ],
      { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('exit', () => {
      const init = output
        .split('\n')
        .map((line) => {
          try {
            return JSON.parse(line) as { mcp_servers?: { name: string }[]; subtype?: string; tools?: string[] };
          } catch {
            return null;
          }
        })
        .find((line) => line?.subtype === 'init');
      if (!init) reject(new Error(`No init message: ${output.slice(0, 300)}`));
      else resolve({ servers: (init.mcp_servers ?? []).map(({ name }) => name), tools: init.tools ?? [] });
    });
  });
}

/** Un tour en flux JSON : l'usage de la fenêtre de 5 h de l'abonnement, tel que Bosco le lit (DT-39). */
async function fiveHourUsage(cwd: string): Promise<null | number> {
  const { stdout } = await run(
    'claude',
    [...ISOLATED, '-p', 'Réponds seulement OK.', '--model', MODEL, '--output-format', 'stream-json', '--verbose'],
    { cwd, maxBuffer: 16 * 1024 * 1024 },
  );
  for (const raw of stdout.split('\n')) {
    try {
      const line = JSON.parse(raw) as {
        rate_limit_info?: { unifiedWindows?: { five_hour?: { utilization?: unknown } } };
        type?: string;
      };
      const usage = line.rate_limit_info?.unifiedWindows?.five_hour?.utilization;
      if (line.type === 'rate_limit_event' && typeof usage === 'number') return usage;
    } catch {
      // Une ligne qui n'est pas du JSON : ignorée
    }
  }
  return null;
}

/**
 * Un tour piloté comme Bosco le lance (mêmes arguments, même protocole de contrôle), dans le profil par défaut : les
 * demandes d'autorisation qui arrivent quand même sont comptées, puis autorisées pour finir le tour.
 */
function pilotedTurn(
  permissionMode: 'auto' | 'bypassPermissions',
  text: string,
  cwd: string,
): Promise<{ permissions: string[] }> {
  // Le lanceur de Bosco reçoit un claude sans les réglages de l'utilisateur, le reste des arguments étant le sien
  const isolated = join(cwd, '..', `${basename(cwd)}-claude.sh`);
  writeFileSync(isolated, `#!/bin/sh\nexec claude ${ISOLATED.join(' ')} "$@"\n`, { mode: 0o755 });
  return new Promise((resolve, reject) => {
    const permissions: string[] = [];
    const turn = new ClaudeTurnRunner(isolated).start(
      {
        addDirs: [],
        appendSystemPrompt: null,
        configDir: join(homedir(), '.claude'),
        cwd,
        launch: null,
        message: { images: [], text },
        resume: false,
        sessionId: randomUUID(),
        settings: { effort: null, model: MODEL, permissionMode },
        tokenFile: null,
      },
      {
        cancelled: () => undefined,
        exited: (error) =>
          error ? reject(new Error(`The ${permissionMode} turn failed: ${error}`)) : resolve({ permissions }),
        permission: (requestId, tool, input) => {
          permissions.push(tool);
          turn.allow(requestId, input);
        },
        question: (requestId) => turn.deny(requestId, 'Pas de question pendant la vérification.'),
        quota: () => undefined,
        result: () => turn.finish(),
        suspended: () => undefined,
      },
    );
  });
}

async function nextPermission(url: string, timeoutMs = 120_000): Promise<Waiting> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { sessions } = await json<{
      sessions: { id: string; waiting: { kind: string; requestId?: string } | null }[];
    }>(`${url}/api/sessions`);
    const session = sessions.find((candidate) => candidate.waiting?.kind === 'permission');
    if (session?.waiting?.requestId) return { id: session.id, requestId: session.waiting.requestId };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('No permission was asked within the delay');
}

async function answer(url: string, waiting: Waiting, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(`${url}/api/sessions/${waiting.id}/permission`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...body, requestId: waiting.requestId }),
  });
  if (response.status !== 204) throw new Error(`The answer was refused: ${response.status}`);
}

const { stdout: version } = await run('claude', ['--version']);
const recordings = mkdtempSync(join(tmpdir(), 'bosco-compat-recordings-'));
const work = mkdtempSync(join(tmpdir(), 'bosco-compat-work-'));
const bosco = await startBosco(recordings);
const checks: string[] = [];
try {
  const profile = join(bosco.profilesRoot, '.claude-compat');
  mkdirSync(join(profile, 'projects'), { recursive: true });
  await json(`${bosco.url}/api/sources`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths: [profile] }),
  });
  const { sources } = await json<{ sources: { id: string }[] }>(`${bosco.url}/api/sources`);
  const source = sources[0];
  if (!source) throw new Error('The compatibility profile is not a source');
  await json(`${bosco.url}/api/sources/${source.id}/live-tracking`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ backup: false }),
  });
  const { hooks } = JSON.parse(readFileSync(join(profile, 'settings.json'), 'utf8')) as { hooks: unknown };
  const settings = join(work, 'hooks.json');
  writeFileSync(settings, JSON.stringify({ hooks }));
  await run('git', ['init', '-q'], { cwd: work });

  // 1. Autorisation donnée dans Bosco : la commande s'exécute
  const allowed = claude('Lance exactement cette commande avec l’outil Bash : touch compat.txt', settings, work);
  await answer(bosco.url, await nextPermission(bosco.url), { behavior: 'allow' });
  await allowed;
  if (!existsSync(join(work, 'compat.txt'))) throw new Error('The allowed command did not run');
  checks.push('« Autoriser » laisse la commande s’exécuter');

  // 2. Refus avec motif : l'agent le reçoit et ne lance pas la commande
  const refused = claude(
    'Lance exactement cette commande avec l’outil Bash : rm compat.txt. Si elle est refusée, n’essaie rien d’autre et recopie le motif du refus.',
    settings,
    work,
  );
  await answer(bosco.url, await nextPermission(bosco.url), { behavior: 'deny', reason: REASON });
  const output = await refused;
  if (!existsSync(join(work, 'compat.txt'))) throw new Error('The refused command ran anyway');
  if (!output.includes('4217')) throw new Error(`The agent did not receive the reason: ${output}`);
  checks.push('« Refuser » arrête la commande et transmet le motif à l’agent');

  // 3. SessionEnd termine les deux sessions
  const { sessions } = await json<{ sessions: { state: string }[] }>(`${bosco.url}/api/sessions`);
  if (!sessions.every((session) => session.state === 'ended')) throw new Error('A session did not end');
  checks.push('SessionEnd fait passer les sessions en Terminée');

  // 4. Lecture de Jira et Confluence par les agents (DT-36) : avec l'attente des connecteurs, réglage non documenté,
  // le connecteur Atlassian est branché dès le démarrage, si le compte de l'abonnement l'a
  const { servers, tools } = await startingTools({ CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS: '30000' }, work);
  if (!servers.includes('claude.ai Atlassian')) checks.push('Connecteur Atlassian absent de ce compte : non vérifié');
  else if (!tools.includes('mcp__claude_ai_Atlassian__getJiraIssue'))
    throw new Error('The Atlassian connector was not plugged in when the session started');
  else checks.push('Le connecteur Atlassian est branché dès le démarrage, avec l’attente des connecteurs');

  // 5. Le flux JSON d'un tour donne l'usage de l'abonnement : sans lui, le quota ne retient plus le worker (RQ-14)
  const usage = await fiveHourUsage(work);
  if (usage === null) throw new Error('No rate_limit_event with unifiedWindows.five_hour.utilization in the stream');
  checks.push(`Le flux d’un tour donne l’usage de la fenêtre de 5 h (${Math.round(usage * 100)} %)`);

  // 6. Tour piloté en « Approuver pour moi » : le mode passe, le classifieur laisse la commande s'exécuter
  const auto = await pilotedTurn('auto', 'Lance exactement cette commande avec l’outil Bash : touch auto.txt', work);
  if (!existsSync(join(work, 'auto.txt'))) throw new Error('The command of the auto mode turn did not run');
  checks.push(
    auto.permissions.length === 0
      ? '« Approuver pour moi » (auto) passe à un tour piloté, et la commande s’exécute sans demande'
      : `« Approuver pour moi » (auto) passe à un tour piloté, mais le classifieur a renvoyé ${auto.permissions.join(', ')} à Bosco`,
  );

  // 7. Tour piloté en « Accès complet » : aucune demande n'arrive dans Bosco
  const bypass = await pilotedTurn(
    'bypassPermissions',
    'Lance exactement cette commande avec l’outil Bash : touch bypass.txt',
    work,
  );
  if (!existsSync(join(work, 'bypass.txt'))) throw new Error('The command of the full access turn did not run');
  if (bypass.permissions.length > 0)
    throw new Error(`The full access turn asked for ${bypass.permissions.join(', ')} anyway`);
  checks.push('« Accès complet » (bypassPermissions) passe à un tour piloté, et la commande s’exécute sans demande');

  const passed = checks.map((check) => '- ' + check).join('\n');
  console.log(`Claude Code ${version.trim()} : compatible.\n${passed}`);
} catch (error) {
  const passed = checks.map((check) => '- ' + check).join('\n');
  console.error(`Claude Code ${version.trim()} : incompatible.\n${passed}`);
  console.error(error);
  process.exitCode = 1;
} finally {
  await bosco.stop();
  rmSync(work, { recursive: true, force: true });
  rmSync(`${work}-claude.sh`, { force: true });
  rmSync(recordings, { recursive: true, force: true });
}
