// Ce que l'application ne montre pas à l'œil : le service et le Node qu'elle lance (CA-APPS-01, CA-APPS-09).
import { describe, expect, it } from 'vitest';
import { parseEvents } from './events.ts';
import { majorOf, nodeCandidates, serviceLayout } from './service.ts';

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

describe('the service the application runs', () => {
  it('CA-APPS-09 · runs the packaged service with its own Node, and the repository service with the workstation one', () => {
    expect(serviceLayout({ packaged: true, resourcesPath: '/opt/Bosco/resources', appDir: '/x' })).toEqual({
      apiMain: '/opt/Bosco/resources/service/apps/api/dist/main.js',
      webDir: '/opt/Bosco/resources/service/apps/web',
      node: '/opt/Bosco/resources/node/bin/node',
    });
    expect(serviceLayout({ packaged: false, resourcesPath: '/x', appDir: '/repo/apps/desktop' })).toEqual({
      apiMain: '/repo/apps/api/dist/main.js',
      webDir: '/repo/apps/web',
      node: null,
    });
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
