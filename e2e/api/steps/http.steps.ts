import type { APIRequestContext } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import { expect } from '@playwright/test';
// Phrases HTTP génériques : la plupart des scénarios de l'API n'en demandent pas d'autres.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FEATURES } from '../paths.ts';
import { type ApiResponse, Then, When } from './fixtures.ts';

async function send(request: APIRequestContext, method: string, path: string, file?: string): Promise<ApiResponse> {
  const response = await request.fetch(path, {
    method,
    ...(file ? { data: JSON.parse(readFileSync(join(FEATURES, file), 'utf8')) as unknown } : {}),
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

const snapshot = (body: unknown) => `${JSON.stringify(body, null, 2)}\n`;

When('I send {word} request to {string}', async ({ request, last }, method: string, path: string) => {
  last.response = await send(request, method, path);
});

When(
  'I send {word} request to {string} with the JSON {string}',
  async ({ request, last }, method: string, path: string, file: string) => {
    last.response = await send(request, method, path, file);
  },
);

When(
  'I send {word} request to {string} with the JSON {string} without waiting',
  async ({ request, last }, method: string, path: string, file: string) => {
    last.pending = send(request, method, path, file);
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

Then('the response should match snapshot', ({ last }) => {
  expect(snapshot(last.response?.body)).toMatchSnapshot();
});

Then('the response should match snapshot except for {string}', ({ last }, fields: string) => {
  expect(snapshot(mask(last.response?.body, fields))).toMatchSnapshot();
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
