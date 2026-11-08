// Ce que les scénarios ne voient pas : la PR selon le réglage du dépôt, et un envoi en échec qui laisse la tâche
// validée (E7c, annotation 4).
import { describe, expect, it } from 'vitest';
import type { TaskView } from './task.service.ts';
import { DEFAULT_RIGHTS, type PullRequestMode } from '../domain/rights.ts';
import { ReviewError, ReviewService } from './review.service.ts';

const task = {
  id: 12,
  title: 'Ajouter « SNCF » au lexique',
  state: 'validated',
  repository: { name: 'api-voix', root: '/home/dev/api-voix' },
  outcome: { base: 'abc', branch: 'bosco/t-12-sncf', from: 'develop', report: 'Fait.', pullRequest: null },
} as unknown as TaskView;

function serviceWith(mode: PullRequestMode, publish: () => Promise<string>) {
  const published: string[] = [];
  const service = new ReviewService(
    {
      get: () => Promise.resolve(task),
      validate: () => Promise.resolve(task),
      reject: () => Promise.resolve(task),
      rejectAndRelaunch: () => Promise.resolve(task),
      attachPullRequest: (_id, url) => {
        published.push(url);
        return Promise.resolve(task);
      },
    },
    { commits: () => Promise.resolve(1), of: () => Promise.resolve({ files: [], diff: '', truncated: false }) },
    { availability: () => Promise.resolve(null), publish },
    { rightsOf: () => Promise.resolve({ ...DEFAULT_RIGHTS, pullRequest: mode }) },
  );
  return { service, published };
}

describe('ReviewService', () => {
  it('pushes nothing by default, on request when asked, and always when set to always', async () => {
    const url = () => Promise.resolve('https://github.com/exemple/api-voix/pull/3');
    const never = serviceWith('never', url);
    await never.service.validate(12, { title: 'T', body: '' });
    const ask = serviceWith('ask', url);
    await ask.service.validate(12, null);
    await ask.service.validate(12, { title: 'T', body: '' });
    const always = serviceWith('always', url);
    await always.service.validate(12, null);
    expect([never.published.length, ask.published.length, always.published.length]).toEqual([0, 1, 1]);
  });

  it('keeps the task validated when the push fails, with the cause', async () => {
    const { service } = serviceWith('always', () => Promise.reject(new Error('Envoi de la branche refusé : rejected')));
    const validation = await service.validate(12, null);
    expect(validation.pullRequestError).toBe('Envoi de la branche refusé : rejected');
  });

  it('asks for a reason to reject', () => {
    const { service } = serviceWith('never', () => Promise.resolve(''));
    expect(() => service.reject(12, '  ', false)).toThrow(ReviewError);
  });
});
