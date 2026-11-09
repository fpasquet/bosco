// Ce que l'application ne montre pas à l'œil : le service et le Node qu'elle lance (CA-APPS-01, CA-APPS-09).
import { describe, expect, it } from 'vitest';
import { parseEvents } from './events.ts';
import { majorOf, nodeCandidates, serviceLayout, startFailure } from './service.ts';

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

describe('startFailure', () => {
  it('CA-APPS-10 · explains a database migrated by a newer Bosco, and shows the last errors otherwise', () => {
    const newer = startFailure(
      '\u001b[31mERROR\u001b[39m DatabaseTooNewError: The database … was migrated by a newer Bosco',
    );
    expect(newer.message).toBe('Tes données viennent d’un Bosco plus récent');
    const other = startFailure('\n  Error: listen EADDRINUSE: address already in use 127.0.0.1:4870\n');
    expect(other).toEqual({
      title: 'Bosco n’a pas démarré',
      message: 'Le service Bosco n’a pas démarré',
      detail: 'Error: listen EADDRINUSE: address already in use 127.0.0.1:4870',
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
