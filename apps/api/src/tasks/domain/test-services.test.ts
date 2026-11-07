// Ce que les scénarios ne voient pas : le choix des services lancés selon le mode (CA-CONT-50).
import { describe, expect, it } from 'vitest';
import { isImage, planOf, type TestService } from './test-services.ts';

const service = (name: string, image: null | string, removed: string[] = []): TestService => ({
  name,
  image,
  removed,
  command: null,
  entrypoint: null,
  environment: {},
  healthcheck: null,
});

const SERVICES = [
  service('app', null),
  service('node', 'node:26'),
  service('database', 'mysql:8.0', ['ports publiés', 'volumes nommés']),
  service('rabbitmq', 'rabbitmq:3.8', ['ports publiés']),
];

describe('planOf', () => {
  it('launches every service with an image but the application and node, in automatic mode', () => {
    const plan = planOf(SERVICES, { mode: 'auto', selected: [], image: null });
    expect(plan.launched.map(({ name }) => name)).toEqual(['database', 'rabbitmq']);
    expect(plan.excluded).toEqual([
      { name: 'app', reason: 'c’est l’application elle-même' },
      { name: 'node', reason: 'sert à lancer l’application' },
    ]);
    expect(plan.removed).toEqual(['ports publiés', 'volumes nommés']);
  });

  it('launches only the checked services, or none', () => {
    const chosen = planOf(SERVICES, { mode: 'choose', selected: ['rabbitmq', 'app'], image: null });
    expect(chosen.launched.map(({ name }) => name)).toEqual(['rabbitmq']);
    expect(planOf(SERVICES, { mode: 'none', selected: [], image: null }).launched).toEqual([]);
  });

  it('accepts an image name, never an option', () => {
    expect([isImage('php:8.4-cli'), isImage('ghcr.io/acme/agent:2'), isImage('--privileged')]).toEqual([
      true,
      true,
      false,
    ]);
  });
});
