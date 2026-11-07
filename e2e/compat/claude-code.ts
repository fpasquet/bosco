// Vérification de compatibilité avec le Claude Code installé (NF-09, RQ-01) : le hook PermissionRequest reçoit
// la réponse de Bosco, autorisation comme refus avec motif, et SessionEnd termine la session. À lancer à chaque
// nouvelle version de Claude Code avec `make claude-compat` : deux sessions courtes sur Haiku, sur l'abonnement.
import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { startBosco } from '../shared/bosco.ts';

const MODEL = 'claude-haiku-5-5';
const REASON = 'Motif de compatibilité 4217.';
const run = promisify(execFile);

interface Waiting {
  id: string;
  requestId: string;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${url} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Lance une session `claude -p` dans un dépôt jetable, avec les hooks de Bosco passés par --settings. */
function claude(prompt: string, settings: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      // Le Claude Code à vérifier est celui du PATH de la personne : c'est lui que ses sessions utilisent
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      'claude',
      ['-p', prompt, '--settings', settings, '--permission-mode', 'default', '--model', MODEL],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve(output) : reject(new Error(`claude exited ${code}: ${output}`))));
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
  rmSync(recordings, { recursive: true, force: true });
}
