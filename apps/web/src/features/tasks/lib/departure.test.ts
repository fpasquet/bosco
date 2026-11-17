import { describe, expect, it } from 'vitest';
import { type DepartureInput, departureOf } from './departure';

const GB = 1024 ** 3;
const base: DepartureInput = {
  concurrency: 1,
  prerequisites: [],
  repository: 'api-voix',
  repositoryBusy: 0,
  worker: { agentMemory: 4 * GB, availableMemory: 28 * GB, capacity: 4, running: 0, unavailable: null },
};

describe('departureOf (CA-TACH-78)', () => {
  it('waits for the prerequisites, with the room available now', () => {
    expect(departureOf({ ...base, prerequisites: [{ state: 'to_review' }] })).toBe(
      "Départ dès que les préalables sont validées, s'il y a de la place · maintenant : 0 / 4 agents, 28 Go disponibles",
    );
  });

  it('starts right away when nothing holds it', () => {
    expect(departureOf({ ...base, prerequisites: [{ state: 'validated' }] })).toBe(
      'Départ tout de suite · maintenant : 0 / 4 agents, 28 Go disponibles',
    );
  });

  it('waits for a place when the worker is full or the memory short', () => {
    const full = { ...base.worker, running: 4 };
    expect(departureOf({ ...base, worker: full })).toMatch(
      /^Départ dès qu'il y aura de la place · maintenant : 4 \/ 4/,
    );
    const short = { ...base.worker, availableMemory: 3.5 * GB };
    expect(departureOf({ ...base, worker: short })).toBe(
      "Départ dès qu'il y aura de la place · maintenant : 0 / 4 agents, 3 Go disponibles",
    );
  });

  it('names the repository that has no place left', () => {
    expect(departureOf({ ...base, repositoryBusy: 1, worker: { ...base.worker, running: 1 } })).toBe(
      "Départ dès qu'il y aura de la place · maintenant : 1 / 4 agents, 28 Go disponibles · api-voix : 1 agent sur 1, attend une place",
    );
  });

  it('says when the worker is unavailable', () => {
    expect(departureOf({ ...base, worker: { ...base.worker, unavailable: 'Docker ne répond pas' } })).toBe(
      'Départ au retour du worker · maintenant : Docker ne répond pas',
    );
  });
});
