// Ce qu'aucun scénario n'atteint, faute de téléphone : le message par lequel l'interface de Bosco confie une
// notification à l'application, et la page qu'ouvre cette notification une fois touchée (CA-APPS-06).
import { describe, expect, it } from 'vitest';
import { notificationPath, pageUrl, parseBridgeMessage } from './bridge';

const WORKSTATION = 'https://192.168.1.24:4310';

describe('a notification link', () => {
  it('CA-APPS-06 · opens the session of the notification in the phone interface', () => {
    const message = parseBridgeMessage(
      JSON.stringify({
        type: 'notification',
        title: 'Autorisation · maison',
        body: 'Ajouter les catégories au budget du foyer',
        path: '/sessions/c41e9a07',
        urgent: true,
      }),
    );
    expect(message).toEqual({
      type: 'notification',
      title: 'Autorisation · maison',
      body: 'Ajouter les catégories au budget du foyer',
      path: '/sessions/c41e9a07',
      urgent: true,
    });
    // La notification locale garde la page ; touchée, elle l'ouvre dans la vue web, à une adresse nouvelle
    const path = notificationPath({ path: '/sessions/c41e9a07' });
    expect(path).toBe('/sessions/c41e9a07');
    expect(pageUrl(WORKSTATION, path ?? '', 1_763_474_040_000)).toBe(
      'https://192.168.1.24:4310/sessions/c41e9a07?from=1763474040000',
    );
    expect(pageUrl(WORKSTATION, '/pair?code=482913', 1)).toBe('https://192.168.1.24:4310/pair?code=482913&from=1');
  });

  it('ignores a notification without a page, and a message that does not come from Bosco', () => {
    expect([notificationPath(undefined), notificationPath({}), notificationPath({ path: '' })]).toEqual([
      null,
      null,
      null,
    ]);
    expect(parseBridgeMessage('{"type":"app-settings"}')).toEqual({ type: 'app-settings' });
    expect(parseBridgeMessage('{"type":"notification","title":"Autorisation"}')).toBeNull();
    expect(parseBridgeMessage('not json')).toBeNull();
  });
});
