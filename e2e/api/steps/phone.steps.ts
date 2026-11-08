// Phrases du téléphone : un navigateur sur le réseau local, qui accepte le certificat créé par Bosco (DT-10).
import { expect } from '@playwright/test';
import { Agent, fetch as phoneFetch } from 'undici';
import { Given, Then, When } from './fixtures.ts';

/** Le téléphone a accepté une fois l'avertissement du certificat de Bosco. */
const phone = new Agent({ connect: { rejectUnauthorized: false } });

let code = '';
let cookie = '';
let phoneStatus = 0;

Given('phone access is enabled', async ({ request }) => {
  const response = await request.put('/api/phone-access', { data: { enabled: true } });
  expect(response.status()).toBe(200);
});

Given('a pairing code is shown on the workstation', async ({ request }) => {
  const response = await request.post('/api/pairing/code');
  code = ((await response.json()) as { code: string }).code;
});

When('the phone enters the code', async ({ bosco }) => {
  const response = await phoneFetch(`${bosco.phoneUrl}/api/pairing/claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Linux; Android 15) Chrome/140' },
    body: JSON.stringify({ code }),
    dispatcher: phone,
  });
  phoneStatus = response.status;
  cookie = response.headers.get('set-cookie')?.split(';')[0] ?? '';
});

When('the phone enters the code {string}', async ({ bosco }, wrong: string) => {
  const response = await phoneFetch(`${bosco.phoneUrl}/api/pairing/claim`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: wrong }),
    dispatcher: phone,
  });
  phoneStatus = response.status;
});

When('the phone opens {string}', async ({ bosco }, path: string) => {
  const response = await phoneFetch(`${bosco.phoneUrl}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
    dispatcher: phone,
  });
  phoneStatus = response.status;
});

When('the phone opens {string} without being paired', async ({ bosco }, path: string) => {
  const response = await phoneFetch(`${bosco.phoneUrl}${path}`, { redirect: 'manual', dispatcher: phone });
  phoneStatus = response.status;
});

When('I remove the paired phone', async ({ request }) => {
  const listed = await request.get('/api/devices');
  const { devices } = (await listed.json()) as { devices: { id: string }[] };
  for (const device of devices) await request.delete(`/api/devices/${device.id}`);
});

Then('the phone gets the code {int}', ({}, status: number) => {
  expect(phoneStatus).toBe(status);
});
