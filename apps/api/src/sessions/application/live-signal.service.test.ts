// Ce que les scénarios ne voient pas : l'ordre des réponses à une autorisation, et une demande qui en remplace une autre.
import { describe, expect, it } from 'vitest';
import type { Session } from '../domain/session.ts';
import type { JournalEntry } from '../domain/transcript-event.ts';
import type { PermissionSettled, SessionRepository } from './ports.ts';
import { LiveSignalService, PermissionAlreadySettled } from './live-signal.service.ts';
import { SessionService } from './session.service.ts';

class MemorySessions implements SessionRepository {
  readonly sessions = new Map<string, Session>();
  find(id: string): Promise<null | Session> {
    return Promise.resolve(this.sessions.get(id) ?? null);
  }
  search(_text: string): Promise<Set<string>> {
    return Promise.resolve(new Set());
  }
  journal(_id: string): Promise<JournalEntry[]> {
    return Promise.resolve([]);
  }
  list(): Promise<Session[]> {
    return Promise.resolve([...this.sessions.values()]);
  }
  save(session: Session, _journal: JournalEntry[]): Promise<void> {
    this.sessions.set(session.id, session);
    return Promise.resolve();
  }
}

function setup() {
  const repository = new MemorySessions();
  const settled: PermissionSettled[] = [];
  const events = {
    permissionSettled: (event: PermissionSettled) => settled.push(event),
    sessionChanged: () => undefined,
  };
  const clock = { now: () => new Date('2026-11-06T14:02:00Z') };
  let next = 0;
  const service = new LiveSignalService(repository, new SessionService(repository, clock, events), events, clock, {
    next: () => `req-${++next}`,
  });
  const origin = { cwd: '/home/dev/labo-ia/packages/bosco', sessionId: 'c41e9a07', sourceId: 'perso' };
  return { origin, repository, service, settled };
}

/** Laisse passer les enregistrements en cours avant de regarder la session. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function waitingOf(repository: MemorySessions) {
  const session = await repository.find('c41e9a07');
  return session?.waiting;
}

describe('LiveSignalService', () => {
  it('answers the hook with the decision given in Bosco, then refuses a second answer', async () => {
    const { origin, repository, service, settled } = setup();
    const answer = service.requestPermission(origin, { tool: 'Bash', detail: 'npm run db:migrate' }, () => undefined);
    await settle();
    const waiting = await waitingOf(repository);
    expect(waiting).toMatchObject({ kind: 'permission', requestId: 'req-1', tool: 'Bash' });
    await service.answerPermission('c41e9a07', 'req-1', { behavior: 'allow' });
    await expect(answer).resolves.toEqual({ behavior: 'allow' });
    await expect(service.answerPermission('c41e9a07', 'req-1', { behavior: 'allow' })).rejects.toBeInstanceOf(
      PermissionAlreadySettled,
    );
    expect(settled.map(({ outcome }) => outcome)).toEqual(['allowed']);
    expect(service.lastSignalAt('perso')).toEqual(new Date('2026-11-06T14:02:00Z'));
  });

  it('lets the terminal win when Claude Code abandons the hook first', async () => {
    const { origin, repository, service, settled } = setup();
    let abandon = () => undefined as void;
    const answer = service.requestPermission(origin, { tool: 'Bash', detail: null }, (onAbandon) => {
      abandon = onAbandon;
    });
    await settle();
    abandon();
    await expect(answer).resolves.toBeNull();
    await expect(
      service.answerPermission('c41e9a07', 'req-1', { behavior: 'deny', reason: null }),
    ).rejects.toBeInstanceOf(PermissionAlreadySettled);
    await settle();
    const waiting = await waitingOf(repository);
    expect(waiting).toBeNull();
    expect(settled.map(({ outcome }) => outcome)).toEqual(['elsewhere']);
  });

  it('leaves a question of the agent to the transcript, without a permission (CA-SESS-83)', async () => {
    const { origin, repository, service } = setup();
    await expect(
      service.requestPermission(origin, { tool: 'AskUserQuestion', detail: null }, () => undefined),
    ).resolves.toBeNull();
    const session = await repository.find('c41e9a07');
    expect(session).toBeNull();
  });

  it('waits after the turn with the last message of the agent', async () => {
    const { origin, repository, service } = setup();
    await service.receive(origin, { kind: 'stop', message: 'Veux-tu que je lance les tests ?' });
    const afterTurn = await waitingOf(repository);
    expect(afterTurn).toMatchObject({
      kind: 'turn',
      message: 'Veux-tu que je lance les tests ?',
    });
    await service.receive(origin, { kind: 'prompt' });
    const afterPrompt = await waitingOf(repository);
    expect(afterPrompt).toBeNull();
  });
});
