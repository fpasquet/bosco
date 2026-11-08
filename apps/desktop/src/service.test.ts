// Ce que l'application ne montre pas à l'œil : le Node du poste qu'elle choisit pour le service (CA-APPS-01).
import { describe, expect, it } from 'vitest';
import { parseEvents } from './events.ts';
import { majorOf, nodeCandidates } from './service.ts';

describe('the Node of the workstation', () => {
  it('reads the major version and tries BOSCO_NODE first', () => {
    expect([majorOf('v26.13.0\n'), majorOf('v24.19.0'), majorOf('nope')]).toEqual([26, 24, 0]);
    expect(nodeCandidates('/nowhere', { BOSCO_NODE: '/opt/node/bin/node' })).toEqual([
      '/opt/node/bin/node',
      '/usr/local/bin/node',
      '/usr/bin/node',
    ]);
  });
});

describe('parseEvents', () => {
  it('reads the complete events of the live stream and keeps the rest', () => {
    const { events, rest } = parseEvents(
      'event: session.updated\ndata: {"session":{"id":"c41e9a07"}}\n\nevent: notification.created\ndata: {"inApp"',
    );
    expect(events).toEqual([{ type: 'session.updated', data: { session: { id: 'c41e9a07' } } }]);
    expect(rest).toBe('event: notification.created\ndata: {"inApp"');
  });
});
