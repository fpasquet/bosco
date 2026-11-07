import { expect } from '@playwright/test';
// Phrases réseau : vérifient que le service n'écoute que sur la boucle locale (NF-13).
import { connect } from 'node:net';
import { networkInterfaces } from 'node:os';
import { Then, When } from './fixtures.ts';

const attempts: { address: string; outcome: 'connected' | 'refused' }[] = [];

function tryConnect(address: string, port: number): Promise<'connected' | 'refused'> {
  return new Promise((resolve) => {
    const socket = connect({ host: address, port, timeout: 2_000 });
    socket.once('connect', () => {
      socket.destroy();
      resolve('connected');
    });
    socket.once('error', () => resolve('refused'));
    socket.once('timeout', () => {
      socket.destroy();
      resolve('refused');
    });
  });
}

When('I try to reach the service on each non-loopback interface', async ({ bosco }) => {
  attempts.length = 0;
  const port = Number(new URL(bosco.url).port);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((info) => info && !info.internal && info.family === 'IPv4')
    .map((info) => info!.address);
  for (const address of addresses) attempts.push({ address, outcome: await tryConnect(address, port) });
});

Then('every connection is refused', () => {
  expect(attempts.filter((attempt) => attempt.outcome === 'connected')).toEqual([]);
});
