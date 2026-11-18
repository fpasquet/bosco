import { describe, expect, it } from 'vitest';
import { type ComposeConfig, dataServicesOf, sandboxCompose, skippedBecause } from './data-services.ts';

// Le fichier Compose de reservations, tel que `docker compose config` le rend : une base, et l'API qui se construit
const config: ComposeConfig = {
  services: {
    install: {
      build: { context: '.' },
      image: 'reservations-dev',
      volumes: [{ type: 'bind', source: '/home/camille/www/reservations', target: '/repo' }],
    },
    db: {
      image: 'postgres:16.13-alpine',
      environment: { POSTGRES_USER: 'reservations', POSTGRES_DB: 'reservations', FROM_HOST: null },
      healthcheck: { test: ['CMD-SHELL', 'pg_isready -U reservations'], interval: '2s' },
      volumes: [{ type: 'volume', source: 'postgres-data', target: '/var/lib/postgresql/data' }],
    },
    cache: { image: 'redis:8', volumes: ['/var/run/docker.sock:/var/run/docker.sock'] },
    queue: { image: 'rabbitmq:4', privileged: true },
  },
};

describe('data services of a project', () => {
  it('CA-SESS-192 · keeps the services on a ready-made image, without build, host folder or host rights', () => {
    expect(dataServicesOf(config)).toEqual([{ image: 'postgres:16.13-alpine', name: 'db' }]);
  });

  it('says why a service stays out of the sandbox', () => {
    expect(skippedBecause(config.services!.install!)).toBe('construit depuis le dépôt');
    expect(skippedBecause(config.services!.cache!)).toBe('monte un dossier du poste');
    expect(skippedBecause(config.services!.queue!)).toBe('demande des droits du poste');
    expect(skippedBecause({ image: 'mongo:8', network_mode: 'host' })).toBe(
      'partage le réseau ou les processus du poste',
    );
  });

  it('reads the short form of the volumes too', () => {
    expect(skippedBecause({ image: 'postgres:16', volumes: ['pgdata:/var/lib/postgresql/data'] })).toBeNull();
    expect(skippedBecause({ image: 'postgres:16', volumes: ['./init.sql:/docker-entrypoint-initdb.d/init.sql'] })).toBe(
      'monte un dossier du poste',
    );
  });
});

describe('compose file of the sandbox', () => {
  const { file } = sandboxCompose(config, { key: 'c41e9a0712ab', network: 'bosco-s-c41e9a0712ab' });
  const db = (file.services as Record<string, Record<string, unknown>>).db!;

  it('CA-SESS-192 · runs on the private network of the sandbox, without a published port, with the ceilings', () => {
    expect(file.name).toBe('bosco-s-c41e9a0712ab');
    expect(file.networks).toEqual({ sandbox: { name: 'bosco-s-c41e9a0712ab', external: true } });
    expect(db.networks).toEqual(['sandbox']);
    expect(db).not.toHaveProperty('ports');
    expect(db).toMatchObject({ cpus: 1, mem_limit: 1024 ** 3, security_opt: ['no-new-privileges:true'] });
    expect(db.labels).toEqual({ 'bosco.session': 'c41e9a0712ab', 'bosco.service': 'db' });
  });

  it('CA-SESS-192 · gives the session its own volumes, never those of the workstation', () => {
    expect(file.volumes).toEqual({ 'postgres-data': {} });
    expect(db.volumes).toEqual([
      { type: 'volume', source: 'postgres-data', target: '/var/lib/postgresql/data', read_only: false },
    ]);
  });

  it('keeps the variables with a value and the health check, which the start waits for', () => {
    expect(db.environment).toEqual({ POSTGRES_USER: 'reservations', POSTGRES_DB: 'reservations' });
    expect(db.healthcheck).toEqual({ test: ['CMD-SHELL', 'pg_isready -U reservations'], interval: '2s' });
  });
});
