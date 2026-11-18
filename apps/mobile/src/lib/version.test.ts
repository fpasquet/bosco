// La page reconnaît l'application et sa version dans l'agent utilisateur : le format ne doit pas changer.
import { describe, expect, it } from 'vitest';
import { APP_VERSION, userAgentName } from './version';

describe('the version of the application', () => {
  it('is the one of app.json, given to the page in the user agent', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(userAgentName('0.3.0-beta.1')).toBe('BoscoAndroid/0.3.0-beta.1');
  });
});
