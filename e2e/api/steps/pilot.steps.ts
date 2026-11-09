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
  channel?: boolean;
  pilot: null | {
    pending: null | { text: string };
    running: boolean;
    settings: { effort: null | string; model: null | string; permissionMode: string };
  };
  repository: null | { name: string };
  waiting:
    | null
    | { kind: 'permission'; detail: null | string; requestId: string }
    | { kind: 'question'; questions: { question: string }[]; requestId: string }
    | { kind: 'turn'; message: null | string };
}
interface SessionDetailDto {
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
  'I start a session in the repository {string} with the JSON {string}',
  async ({ bosco, last, request }, repository: string, file: string) => {
    const body = { ...message(file, bosco.profilesRoot), repository: join(bosco.profilesRoot, repository) };
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
  expect({
    permissionMode: view.pilot?.settings.permissionMode,
    model: view.pilot?.settings.model ?? '',
    effort: view.pilot?.settings.effort ?? '',
    repository: view.repository?.name,
  }).toEqual(expected);
});

Then('{string} should wait for the permission {string}', async ({ request }, session: string, detailText: string) => {
  await eventually(
    request,
    idOf(session),
    (view) => view.waiting?.kind === 'permission' && view.waiting.detail === detailText,
  );
});

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
