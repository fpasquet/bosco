// Phrases des sessions pilotées par Bosco (E2e à E2h, E16a) : le faux Claude Code des scénarios joue chaque tour.
import type { APIRequestContext } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FEATURES } from '../paths.ts';
import { Given, Then, When } from './fixtures.ts';

/** Ce que les scénarios lisent du détail d'une session (le paquet e2e ne dépend pas du contrat partagé) */
interface SessionView {
  addedProjects: { name: string }[];
  channel?: boolean;
  pilot: null | {
    pending: null | { text: string };
    running: boolean;
    sandbox?: null | { branch: string; from: string; state: string };
    settings: { effort: null | string; model: null | string; permissionMode: string };
  };
  project: null | { name: string };
  sourceId: string;
  waiting:
    | null
    | { kind: 'permission'; detail: null | string; requestId: string }
    | { kind: 'question'; questions: { question: string }[]; requestId: string }
    | { kind: 'turn'; message: null | string };
}
interface SessionDetailDto {
  journal: ({ kind: string } & Record<string, unknown>)[];
  session: SessionView;
}

/** Session démarrée par le scénario : son identifiant vient de Bosco */
let started = '';

/** Une image PNG de 1 × 1 pixel, jointe aux messages des scénarios */
const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function message(file: string, profilesRoot: string): Record<string, unknown> {
  const body = JSON.parse(readFileSync(join(FEATURES, file), 'utf8').replaceAll('{{profiles}}', profilesRoot)) as {
    images?: { name: string }[];
  };
  return { ...body, images: (body.images ?? []).map(({ name }) => ({ name, mediaType: 'image/png', data: PIXEL })) };
}

const idOf = (session: string) => (session === 'the started session' ? started : session);

async function detail(request: APIRequestContext, id: string): Promise<SessionDetailDto['session']> {
  const response = await request.get(`/api/sessions/${id}`);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as SessionDetailDto;
  return body.session;
}

/** Attend que la session arrive dans l'état voulu : chaque tour se joue en arrière-plan. */
async function eventually(
  request: APIRequestContext,
  id: string,
  check: (session: SessionDetailDto['session']) => boolean,
): Promise<SessionDetailDto['session']> {
  let last: null | SessionDetailDto['session'] = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await request.get(`/api/sessions/${id}`);
    if (response.status() === 200) {
      last = ((await response.json()) as SessionDetailDto).session;
      if (check(last)) return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`The session ${id} did not get there: ${JSON.stringify(last)}`);
}

When(
  'I start a session in the project {string} with the JSON {string}',
  async ({ bosco, last, request }, project: string, file: string) => {
    const body = { ...message(file, bosco.profilesRoot), project: join(bosco.profilesRoot, project) };
    const response = await request.post('/api/pilot/sessions', { data: body });
    const json = (await response.json()) as { sessionId?: string };
    last.response = { status: response.status(), body: json };
    started = json.sessionId ?? '';
  },
);

When('I write to {string} with the JSON {string}', async ({ bosco, last, request }, session: string, file: string) => {
  const response = await request.post(`/api/sessions/${idOf(session)}/messages`, {
    data: message(file, bosco.profilesRoot),
  });
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When('I cancel the pending message of {string}', async ({ last, request }, session: string) => {
  const response = await request.delete(`/api/sessions/${idOf(session)}/messages/pending`);
  last.response = { status: response.status(), body: null };
});

When('I stop the turn of {string}', async ({ last, request }, session: string) => {
  const response = await request.post(`/api/sessions/${idOf(session)}/interrupt`);
  last.response = { status: response.status(), body: null };
});

Then('{string} should end its turn with {string}', async ({ request }, session: string, text: string) => {
  await eventually(
    request,
    idOf(session),
    (view) => !view.pilot?.running && view.waiting?.kind === 'turn' && view.waiting.message === text,
  );
});

Then(
  '{string} should be running with the pending message {string}',
  async ({ request }, session: string, text: string) => {
    // « \n » dans le scénario : un retour à la ligne entre deux messages joints
    const expected = text.replaceAll(String.raw`\n`, '\n');
    await eventually(
      request,
      idOf(session),
      (view) => view.pilot?.running === true && view.pilot.pending?.text === expected,
    );
  },
);

Then('{string} should have no pending message', async ({ request }, session: string) => {
  const view = await detail(request, idOf(session));
  expect(view.pilot?.pending ?? null).toBeNull();
});

Then('{string} should be piloted with:', async ({ request }, session: string, table: DataTable) => {
  const view = await detail(request, idOf(session));
  const expected = table.rowsHash();
  const actual: Record<string, string | undefined> = {
    permissionMode: view.pilot?.settings.permissionMode,
    model: view.pilot?.settings.model ?? '',
    effort: view.pilot?.settings.effort ?? '',
    project: view.project?.name,
  };
  // Le profil se lit par son nom (« perso ») : son identifiant change d'une instance à l'autre
  if ('profile' in expected) {
    const response = await request.get('/api/sources');
    const { sources } = (await response.json()) as { sources: { id: string; label: string }[] };
    actual.profile = sources.find(({ id }) => id === view.sourceId)?.label;
  }
  expect(actual).toEqual(expected);
});

Then('{string} should wait for the permission {string}', async ({ request }, session: string, detailText: string) => {
  await eventually(
    request,
    idOf(session),
    (view) => view.waiting?.kind === 'permission' && view.waiting.detail === detailText,
  );
});

Then(
  '{string} should have auto mode suspended after {int} refusals in a row',
  async ({ request }, session: string, count: number) => {
    // La suspension est une ligne du journal de la session, gardée d'un démarrage de Bosco à l'autre
    for (let attempt = 0; attempt < 60; attempt++) {
      const response = await request.get(`/api/sessions/${idOf(session)}`);
      const { journal } = (await response.json()) as SessionDetailDto;
      const line = journal.find(({ kind }) => kind === 'autoModeSuspended');
      if (line) {
        expect(line).toMatchObject({ count, total: false });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`The session ${session} has no suspension in its journal`);
  },
);

/** Identifiant d'une source, d'après le dossier de son profil. */
async function sourceOf(request: APIRequestContext, profile: string): Promise<string> {
  const response = await request.get('/api/sources');
  const { sources } = (await response.json()) as { sources: { id: string; path: string }[] };
  const found = sources.find(({ path }) => path.endsWith(`/${profile}`));
  if (!found) throw new Error(`No source for the profile ${profile}`);
  return found.id;
}

When('I read the settings of the profile {string}', async ({ last, request }, profile: string) => {
  const id = await sourceOf(request, profile);
  const response = await request.get(`/api/sources/${id}/settings`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When(
  'I set the defaults of the profile {string} with the JSON {string}',
  async ({ bosco, last, request }, profile: string, file: string) => {
    const id = await sourceOf(request, profile);
    const data = JSON.parse(
      readFileSync(join(FEATURES, file), 'utf8').replaceAll('{{profiles}}', bosco.profilesRoot),
    ) as unknown;
    const response = await request.put(`/api/sources/${id}/defaults`, { data });
    last.response = { status: response.status(), body: (await response.json()) as unknown };
  },
);

When('I allow the permission of {string}', async ({ request }, session: string) => {
  const view = await detail(request, idOf(session));
  if (view.waiting?.kind !== 'permission') throw new Error('No permission waits');
  const response = await request.post(`/api/sessions/${idOf(session)}/permission`, {
    data: { behavior: 'allow', requestId: view.waiting.requestId },
  });
  expect(response.status()).toBe(204);
});

Then('{string} should ask the question {string}', async ({ request }, session: string, question: string) => {
  await eventually(
    request,
    idOf(session),
    (view) => view.waiting?.kind === 'question' && view.waiting.questions[0]?.question === question,
  );
});

When('I answer the question of {string} with {string}', async ({ last, request }, session: string, answer: string) => {
  const view = await detail(request, idOf(session));
  if (view.waiting?.kind !== 'question') throw new Error('No question waits');
  const response = await request.post(`/api/sessions/${idOf(session)}/answers`, {
    data: { requestId: view.waiting.requestId, answers: [[answer].filter(Boolean)] },
  });
  last.response = { status: response.status(), body: null };
});

When('I skip the question of {string}', async ({ last, request }, session: string) => {
  const view = await detail(request, idOf(session));
  if (view.waiting?.kind !== 'question') throw new Error('No question waits');
  const response = await request.post(`/api/sessions/${idOf(session)}/answers`, {
    data: { requestId: view.waiting.requestId, answers: null },
  });
  last.response = { status: response.status(), body: null };
});

Given(
  'the session {string} is open in a terminal of the profile {string}',
  async ({ bosco }, sessionId: string, profile: string) => {
    // Registre des sessions ouvertes de Claude Code : un processus vivant, celui du scénario
    const file = join(bosco.profilesRoot, profile, 'sessions', `${process.pid}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ pid: process.pid, sessionId }));
    // Bosco relit le registre toutes les 2 s
    await new Promise((resolve) => setTimeout(resolve, 2500));
  },
);

Given('the folder {string} has the files:', ({ bosco }, folder: string, table: DataTable) => {
  for (const [path] of table.raw()) {
    const file = join(bosco.profilesRoot, folder, path ?? '');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, '');
  }
});

Given(
  'the Claude Code profile {string} has the skill {string} described as {string}',
  ({ bosco }, profile: string, skill: string, description: string) => {
    const dir = join(bosco.profilesRoot, profile, 'skills', skill);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${skill}\ndescription: ${description}\n---\n\n# ${skill}\n`);
  },
);

Then('the suggestions should be {string}', ({ last }, values: string) => {
  const { suggestions } = last.response?.body as { suggestions: { value: string }[] };
  expect(suggestions.map(({ value }) => value).join(', ')).toBe(values);
});

/** Messages reçus par le canal de Bosco ouvert par le scénario, comme le ferait le serveur du canal */
const channelMessages: string[] = [];
let channelStream: AbortController | null = null;

Given('the session {string} has its Bosco channel open', async ({ bosco, request }, sessionId: string) => {
  channelMessages.splice(0);
  channelStream?.abort();
  channelStream = new AbortController();
  const response = await fetch(`${bosco.url}/api/channel/stream?session=${sessionId}`, {
    headers: { authorization: `Bearer ${bosco.secret()}` },
    signal: channelStream.signal,
  });
  expect(response.status).toBe(200);
  const decoder = new TextDecoder();
  void (async () => {
    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        for (const match of decoder.decode(chunk).matchAll(/data: (.+)/g))
          channelMessages.push((JSON.parse(match[1] ?? '{}') as { text: string }).text);
      }
    } catch {
      // flux fermé par le scénario
    }
  })();
  await eventually(request, sessionId, (view) => view.channel === true);
});

Then('the Bosco channel receives {string}', async ({}, text: string) => {
  await expect.poll(() => channelMessages.join('|')).toContain(text);
  channelStream?.abort();
});

Then(
  '{string} should run in a sandbox on the branch {string} from {string}, {string}',
  async ({ request }, session: string, branch: string, from: string, state: string) => {
    await eventually(
      request,
      idOf(session),
      (view) =>
        view.pilot?.sandbox?.branch === branch &&
        view.pilot.sandbox.from === from &&
        view.pilot.sandbox.state === state,
    );
  },
);

When('I stop the sandbox of {string}', async ({ last, request }, session: string) => {
  const response = await request.post(`/api/sessions/${idOf(session)}/sandbox/stop`);
  last.response = { status: response.status(), body: null };
});

When('I delete the sandbox of {string}', async ({ last, request }, session: string) => {
  const response = await request.delete(`/api/sessions/${idOf(session)}/sandbox`);
  last.response = { status: response.status(), body: null };
});

When('I retrieve the branch of {string}', async ({ last, request }, session: string) => {
  const response = await request.post(`/api/sessions/${idOf(session)}/sandbox/retrieve`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When('I read the refused exits of {string}', async ({ last, request }, session: string) => {
  const response = await request.get(`/api/sessions/${idOf(session)}/sandbox/refusals`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

Then('{string} should see the other projects {string}', async ({ request }, session: string, names: string) => {
  await eventually(request, idOf(session), (view) => view.addedProjects.map(({ name }) => name).join(', ') === names);
});

When('I read the branches of {string}', async ({ last, request }, session: string) => {
  const response = await request.get(`/api/sessions/${idOf(session)}/sandbox/branches`);
  last.response = { status: response.status(), body: (await response.json()) as unknown };
});

When(
  'I retrieve the branch of the project {string} of {string}',
  async ({ bosco, last, request }, project: string, session: string) => {
    const response = await request.post(`/api/sessions/${idOf(session)}/sandbox/retrieve`, {
      data: { project: join(bosco.profilesRoot, project) },
    });
    last.response = { status: response.status(), body: (await response.json()) as unknown };
  },
);
