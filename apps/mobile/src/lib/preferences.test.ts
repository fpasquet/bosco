// Ce qu'aucun scénario n'atteint, faute de téléphone : « Rester connecté en arrière-plan » désactivé par défaut,
// et le service au premier plan (avec sa notification permanente) lancé seulement s'il est activé (CA-APPS-08).
import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, keepsAlive, readPreferences } from './preferences';

describe('staying connected in the background', () => {
  it('CA-APPS-08 · is off by default, and keeps the app alive only when on and paired to a workstation', () => {
    expect(readPreferences(null)).toEqual({ background: false, vibrate: true });
    expect(readPreferences('{"vibrate":false}')).toEqual({ background: false, vibrate: false });
    const on = readPreferences('{"background":true}');
    expect(on).toEqual({ background: true, vibrate: true });
    expect([keepsAlive(on, true), keepsAlive(on, false), keepsAlive(DEFAULT_PREFERENCES, true)]).toEqual([
      true,
      false,
      false,
    ]);
  });
});
