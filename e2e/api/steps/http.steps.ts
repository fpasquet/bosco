import type { APIRequestContext } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';
// Phrases HTTP génériques : la plupart des scénarios de l'API n'en demandent pas d'autres.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FEATURES } from '../paths.ts';
import { type ApiResponse, Then, When } from './fixtures.ts';

const PROJECT = /"?\{\{project:([^}]+)\}\}"?/g;

/**
 * Remplace {{project:maison}} par l'identifiant du projet nommé : Bosco adopte les dépôts des sessions dans l'ordre où il
 * les lit, l'identifiant d'un projet n'est pas fixé d'avance.
 */
async function withProjects(request: APIRequestContext, text: string): Promise<string> {
  if (!text.includes('{{project:')) return text;
  const { projects } = (await (await request.get('/api/projects')).json()) as {
    projects: { id: number; name: string }[];
  };
  return text.replaceAll(PROJECT, (_, name: string) => {
    const found = projects.find((project) => project.name === name);
    if (!found) throw new Error(`No project ${name}`);
    return String(found.id);
  });
}

/**
 * Corps d'une requête lu dans un fichier d'exemple ; {{profiles}} y désigne le dossier des profils du scénario,
 * "{{project:maison}}" l'identifiant d'un projet.
 */
async function body(request: APIRequestContext, file: string, profilesRoot: string): Promise<unknown> {
  const text = readFileSync(join(FEATURES, file), 'utf8').replaceAll('{{profiles}}', profilesRoot);
  return JSON.parse(await withProjects(request, text)) as unknown;
}

async function send(
  request: APIRequestContext,
  method: string,
  path: string,
  file?: string,
  profilesRoot = '',
): Promise<ApiResponse> {
  const response = await request.fetch(await withProjects(request, path), {
    method,
    ...(file ? { data: await body(request, file, profilesRoot) } : {}),
    timeout: 15_000,
  });
  const text = await response.text();
  return { status: response.status(), body: text ? (JSON.parse(text) as unknown) : null };
}

/** Remplace la valeur des champs listés (notation pointée), pour comparer une réponse sans ses valeurs changeantes. */
function mask(body: unknown, fields: string): unknown {
  const copy = structuredClone(body) as Record<string, unknown>;
  for (const field of fields
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)) {
    const keys = field.split('.');
    const leaf = keys.pop() as string;
    const parent = keys.reduce<Record<string, unknown> | undefined>(
      (node, key) => node?.[key] as Record<string, unknown> | undefined,
      copy,
    );
    if (!parent || !(leaf in parent)) throw new Error(`The field "${field}" is not in the response`);
    parent[leaf] = '<masked>';
  }
  return copy;
}

/** Réponse mise en forme pour une capture ; le dossier des profils du scénario, qui change à chaque lancement, devient <profiles>. */
const snapshot = (body: unknown, profilesRoot: string) =>
  `${JSON.stringify(body, null, 2).replaceAll(profilesRoot, '<profiles>')}\n`;

When('I send {word} request to {string}', async ({ bosco, request, last }, method: string, path: string) => {
  // {{profiles}} dans l'adresse désigne aussi le dossier des profils du scénario (un projet en paramètre)
  last.response = await send(request, method, path.replaceAll('{{profiles}}', encodeURIComponent(bosco.profilesRoot)));
});

When(
  'I send {word} request to {string} with the JSON {string}',
  async ({ bosco, last, request }, method: string, path: string, file: string) => {
    last.response = await send(request, method, path, file, bosco.profilesRoot);
  },
);

When(
  'I send {word} request to {string} with the JSON {string} without waiting',
  async ({ bosco, last, request }, method: string, path: string, file: string) => {
    last.pending = send(request, method, path, file, bosco.profilesRoot);
    // une demande restée sans réponse à la fin du scénario n'est pas une erreur
    last.pending.catch(() => undefined);
    // laisse la requête partir avant l'étape suivante
    await new Promise((r) => setTimeout(r, 100));
  },
);

Then('the response code should be {int}', ({ last }, status: number) => {
  expect(last.response?.status).toBe(status);
});

Then('the pending response code should be {int}', async ({ last }, status: number) => {
  last.response = await last.pending;
  expect(last.response?.status).toBe(status);
});

Then('the response should match snapshot', ({ bosco, last }) => {
  expect(snapshot(last.response?.body, bosco.profilesRoot)).toMatchSnapshot();
});

Then('the response should match snapshot except for {string}', ({ bosco, last }, fields: string) => {
  expect(snapshot(mask(last.response?.body, fields), bosco.profilesRoot)).toMatchSnapshot();
});

Then('the response property {string} should equal {string}', ({ last }, path: string, value: string) => {
  const actual = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], last.response?.body);
  expect(String(actual)).toBe(value);
});

Then('the event stream receives {string} with:', async ({ events }, type: string, table: DataTable) => {
  const expected = table.rowsHash();
  await expect
    .poll(
      () =>
        events.some(
          (e) => e.type === type && Object.entries(expected).every(([key, value]) => String(e.data[key]) === value),
        ),
      {
        message: `event ${type} with ${JSON.stringify(expected)}; received ${JSON.stringify(events)}`,
        timeout: 3_000,
      },
    )
    .toBe(true);
});

Then('the response property {string} should match the names {string}', ({ last }, path: string, names: string) => {
  const list = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], last.response?.body);
  expect((list as { name: string }[]).map(({ name }) => name).join(',')).toBe(names);
});

Then('the response property {string} should contain {string}', ({ last }, path: string, value: string) => {
  const actual = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], last.response?.body);
  expect(String(actual)).toContain(value);
});

Then('the response property {string} should not contain {string}', ({ last }, path: string, value: string) => {
  const actual = path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], last.response?.body);
  expect(String(actual)).not.toContain(value);
});

Then('the response should not contain {string}', ({ last }, value: string) => {
  expect(JSON.stringify(last.response?.body)).not.toContain(value);
});
