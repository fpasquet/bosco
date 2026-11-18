// Captures du site de documentation (apps/docs/public/screenshots) : Bosco lancé comme pour les scénarios du web, sur
// les projets et groupes du fil rouge, puis photographié par Playwright. `make docs-screenshots`, après `make build`.
import { type Browser, type BrowserContextOptions, chromium, devices } from '@playwright/test';
import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { type Bosco, ROOT, startBosco } from '../shared/bosco.ts';
import { sendHook, sourceIdOf } from '../shared/hooks.ts';
import { addGroup, addProjects, createFolders, setDefaults, writeGroupInstructions } from '../shared/projects.ts';
import { TRANSCRIPTS } from '../shared/transcripts.ts';
import { RECORDINGS } from '../web/paths.ts';

const OUT = join(ROOT, 'apps/docs/public/screenshots');
const TIMESTAMP = /"timestamp":\s*"([^"]+)"/g;

interface Session {
  id: string;
  profile: string;
  transcript: string;
  /** Minutes depuis le dernier événement ; sans valeur, le transcript garde ses dates */
  agoMinutes?: number;
}

const SESSIONS: Session[] = [
  { id: 'c41e9a07', profile: '.claude-perso', transcript: 'session-maison-budget', agoMinutes: 1 },
  { id: '5b2d81e4', profile: '.claude', transcript: 'session-creneaux-usage', agoMinutes: 0.2 },
  { id: '8e14c2b7', profile: '.claude', transcript: 'session-sejours-usage', agoMinutes: 0.5 },
  { id: '5e0a91c3', profile: '.claude', transcript: 'session-maison-recettes', agoMinutes: 47 },
  { id: 'd93b51f0', profile: '.claude', transcript: 'session-api-tarifs-usage' },
  { id: 'a41f07c2', profile: '.claude-perso', transcript: 'session-site-perso-dependances' },
];

/** Décale les dates d'un transcript pour que son dernier événement date de `ago` millisecondes. */
function lastActedAgo(file: string, ago: number): void {
  const content = readFileSync(file, 'utf8');
  const last = Math.max(...[...content.matchAll(TIMESTAMP)].map(([, time]) => Date.parse(time ?? '')));
  const shift = Date.now() - ago - last;
  writeFileSync(
    file,
    content.replaceAll(
      TIMESTAMP,
      (_, time: string) => `"timestamp": "${new Date(Date.parse(time) + shift).toISOString()}"`,
    ),
  );
}

/** Un processus vivant par session ouverte : Claude Code tient le registre <profil>/sessions/<pid>.json. */
function openInClaudeCode(transcript: string, sessionId: string): ChildProcess {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1e9)'], { stdio: 'ignore' });
  const profile = dirname(dirname(dirname(transcript)));
  const entry = join(profile, 'sessions', `${child.pid}.json`);
  mkdirSync(dirname(entry), { recursive: true });
  writeFileSync(entry, JSON.stringify({ pid: child.pid, sessionId, status: 'busy', kind: 'interactive' }));
  return child;
}

async function call(bosco: Bosco, method: string, path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${bosco.url}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path} answered ${response.status}`);
  return response.status === 204 ? null : await response.json();
}

async function idOf(bosco: Bosco, kind: 'groups' | 'projects', name: string): Promise<number> {
  const body = (await call(bosco, 'GET', `/api/${kind}`)) as Record<string, { id: number; name: string }[]>;
  const found = body[kind]?.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No ${kind} named ${name}`);
  return found.id;
}

/** Données du fil rouge : profils pro et perso, projets, groupes et leurs instructions, sessions vivantes. */
async function seed(bosco: Bosco): Promise<{ children: ChildProcess[]; pending: AbortController }> {
  const children: ChildProcess[] = [];
  for (const session of SESSIONS) {
    const file = bosco.writeProfileTranscript(
      session.profile,
      join(TRANSCRIPTS, `${session.transcript}.jsonl`),
      session.id,
    );
    if (session.agoMinutes === undefined) continue;
    lastActedAgo(file, session.agoMinutes * 60_000);
    children.push(openInClaudeCode(file, session.id));
  }
  // Accès à l'abonnement de chaque profil, comme après une connexion dans Claude Code
  for (const profile of ['.claude', '.claude-perso']) {
    const dir = join(bosco.profilesRoot, profile);
    writeFileSync(join(dir, '.credentials.json'), '{}');
    writeFileSync(join(dir, '.claude.json'), JSON.stringify({ oauthAccount: { emailAddress: 'camille@exemple.dev' } }));
  }
  await call(bosco, 'POST', '/api/sources', {
    paths: [join(bosco.profilesRoot, '.claude'), join(bosco.profilesRoot, '.claude-perso')],
  });

  createFolders(bosco, [
    { folder: 'site-clubs', git: true },
    { folder: 'api-disponibilites', git: true },
  ]);
  await addProjects(bosco, ['api-tarifs', 'creneaux', 'site-clubs', 'sejours', 'api-disponibilites', 'maison']);
  await addProjects(bosco, ['site-perso']);
  await addGroup(bosco, 'Club des Trois Lacs', ['api-tarifs', 'creneaux', 'site-clubs']);
  await addGroup(bosco, 'Gîtes du Haut-Vallon', ['sejours', 'api-disponibilites']);
  await addGroup(bosco, 'Perso', ['maison', 'site-perso']);
  await writeGroupInstructions(
    bosco,
    'Club des Trois Lacs',
    'Les textes lus par les joueurs sont en français.\nLes tickets du club se citent par leur clé (LAC-123).',
  );
  await writeGroupInstructions(
    bosco,
    'Gîtes du Haut-Vallon',
    'Les dates s’affichent au format français (17 nov. 2026).\nLes tickets des gîtes se citent par leur clé (GHV-123).',
  );
  await writeGroupInstructions(bosco, 'Perso', 'Aucun service payant ni de télémétrie.');
  await writeGroupInstructions(
    bosco,
    'Tous les projets',
    'Messages de commit en anglais, au format Conventional Commits.\nNode 22 au minimum.',
  );
  await setDefaults(bosco, 'group', 'Club des Trois Lacs', { permissionMode: 'auto' });

  for (const profile of ['.claude', '.claude-perso']) {
    const id = await sourceIdOf(bosco.url, profile);
    await call(bosco, 'PUT', `/api/sources/${id}/live-tracking`, { backup: true });
  }
  // La demande d'autorisation reste ouverte jusqu'à la fin des captures, comme Claude Code qui attend la réponse
  const pending = new AbortController();
  sendHook(
    bosco.profilesRoot,
    '.claude-perso',
    {
      session_id: 'c41e9a07',
      transcript_path: join(bosco.profilesRoot, 'transcript.jsonl'),
      cwd: join(bosco.profilesRoot, 'maison', 'packages', 'budget'),
      permission_mode: 'default',
      hook_event_name: 'PermissionRequest',
      tool_name: 'Bash',
      tool_input: { command: 'npm run db:migrate' },
    },
    { signal: pending.signal },
  ).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { children, pending };
}

/** Réponse de l'agent du bac à sable, reprise du fil rouge. */
const SANDBOX_REPLY =
  'Le schéma de config passe avec TypeScript 6. Je n’ai pas pu lire la base de configuration partagée en ligne (accès refusé) : j’ai gardé les options actuelles du tsconfig. Tout est prêt sur la branche.';

/** Une session en bac à sable sur api-tarifs, au conteneur démarré et mesuré (des bacs à sable scriptés, sans Docker). */
async function startSandbox(bosco: Bosco): Promise<string> {
  const { sessionId } = (await call(bosco, 'POST', '/api/pilot/sessions', {
    images: [],
    profile: join(bosco.profilesRoot, '.claude-perso'),
    project: join(bosco.profilesRoot, 'api-tarifs'),
    sandbox: { branch: 'bosco/s-typescript-6', startBranch: 'develop' },
    settings: { effort: null, model: null, permissionMode: 'acceptEdits' },
    text: 'Monte TypeScript en version 6, et vérifie que le schéma de config passe.',
  })) as { sessionId: string };
  for (let attempt = 0; attempt < 40; attempt++) {
    const view = (await call(bosco, 'GET', '/api/containers')) as { sandboxes: unknown[] };
    const detail = (await call(bosco, 'GET', `/api/sessions/${sessionId}`)) as {
      session: { pilot: { running: boolean } };
    };
    if (view.sandboxes.length > 0 && !detail.session.pilot.running) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  // Le faux Claude Code répond en rappelant ce qu'il a reçu : son transcript prend le titre et la réponse du fil rouge
  const { sources } = (await call(bosco, 'GET', '/api/sources')) as { sources: { managed: boolean; path: string }[] };
  const profile = sources.find(({ managed }) => managed)?.path ?? '';
  const projects = join(profile, 'projects');
  for (const folder of readdirSync(projects)) {
    const file = join(projects, folder, `${sessionId}.jsonl`);
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.replace(/"text":"Reçu : [^"]*"/, `"text":"${SANDBOX_REPLY}"`));
    const title = JSON.stringify({
      type: 'ai-title',
      aiTitle: 'Monter TypeScript en version 6',
      sessionId,
      timestamp: new Date().toISOString(),
    });
    writeFileSync(file, `${lines.join('\n').trimEnd()}\n${title}\n`);
  }
  // Le temps que Bosco lise le titre ajouté au transcript
  for (let attempt = 0; attempt < 40; attempt++) {
    const detail = (await call(bosco, 'GET', `/api/sessions/${sessionId}`)) as { session: { title: null | string } };
    if (detail.session.title) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return sessionId;
}

async function shoot(
  browser: Browser,
  bosco: Bosco,
  shots: { name: string; path: string; tab?: string }[],
  options: BrowserContextOptions,
): Promise<void> {
  const context = await browser.newContext({
    ...options,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  for (const { name, path, tab } of shots) {
    await page.goto(`${bosco.url}${path}`);
    await page.getByRole('main').waitFor();
    if (tab) await page.getByRole('tab', { name: tab, exact: true }).click();
    // Le temps que les requêtes de la page arrivent et que les squelettes de chargement disparaissent
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    console.log(`apps/docs/public/screenshots/${name}.png`);
  }
  await context.close();
}

const bosco = await startBosco(RECORDINGS, { home: true });
let seeded: Awaited<ReturnType<typeof seed>> | null = null;
const browser = await chromium.launch();
try {
  seeded = await seed(bosco);
  const club = await idOf(bosco, 'groups', 'Club des Trois Lacs');
  const apiTarifs = await idOf(bosco, 'projects', 'api-tarifs');
  mkdirSync(OUT, { recursive: true });
  await shoot(
    browser,
    bosco,
    [
      { name: 'overview', path: '/' },
      { name: 'session-permission', path: '/sessions/c41e9a07' },
      // Le dossier personnel du service est celui du scénario : les chemins s'écrivent depuis « ~ »
      { name: 'new-session', path: `/sessions/new?project=${apiTarifs}` },
      { name: 'projects', path: '/projects' },
      { name: 'group-instructions', path: `/groups/${club}/instructions` },
      { name: 'project-context', path: `/projects/${apiTarifs}/context` },
      { name: 'usage', path: '/usage' },
      { name: 'settings-sources', path: '/settings/sources' },
      { name: 'settings-sandbox', path: '/settings/sandbox' },
    ],
    { viewport: { width: 1440, height: 900 } },
  );
  await shoot(browser, bosco, [{ name: 'phone-overview', path: '/' }], devices['Pixel 7']);
  // Le bac à sable vient après : la vue d'ensemble garde les sessions du fil rouge
  const sandboxed = await startSandbox(bosco);
  await shoot(browser, bosco, [{ name: 'session-sandbox', path: `/sessions/${sandboxed}` }], {
    viewport: { width: 1440, height: 900 },
  });
  await shoot(browser, bosco, [{ name: 'phone-session-sandbox', path: `/sessions/${sandboxed}`, tab: 'Bac à sable' }], {
    ...devices['Pixel 7'],
  });
} finally {
  await browser.close();
  seeded?.pending.abort();
  for (const child of seeded?.children ?? []) child.kill();
  await bosco.stop();
}
