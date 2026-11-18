// Ce qu'aucun scénario n'atteint, faute de téléphone : ce que dit l'écran du poste injoignable, l'heure de la
// dernière mise à jour et le rythme des tentatives automatiques (CA-APPS-07).
import { describe, expect, it } from 'vitest';
import { countdown, RETRY_S, unreachableText, updateTime } from './unreachable';

describe('the unreachable workstation', () => {
  it('CA-APPS-07 · says so with the address and the last update, and offers to retry or change workstation', () => {
    const lastUpdate = updateTime(new Date(2026, 10, 18, 15, 14, 37));
    expect(lastUpdate).toBe('15:14');
    expect(unreachableText('https://192.168.1.24:4310', lastUpdate)).toEqual({
      title: 'Bosco n’est pas joignable',
      hint:
        'Le téléphone doit être sur le même réseau que le poste (https://192.168.1.24:4310). ' +
        'Dernière mise à jour à 15:14.',
      retry: 'Réessayer',
      change: 'Changer de poste',
    });
    // Jamais chargé depuis l'ouverture : l'adresse seule
    expect(unreachableText('https://192.168.1.24:4310', null).hint).toBe(
      'Le téléphone doit être sur le même réseau que le poste (https://192.168.1.24:4310).',
    );
  });

  it('CA-APPS-07 · retries on its own every 5 seconds', () => {
    let left = RETRY_S;
    const retries: number[] = [];
    for (let second = 1; second <= 12; second++) {
      const next = countdown(left);
      if (next.retry) retries.push(second);
      left = next.left;
    }
    expect(retries).toEqual([5, 10]);
    expect(left).toBe(3);
  });
});
