// Ce que les scénarios ne voient pas : les tailles et les mots écrits autrement que dans les maquettes.
import { describe, expect, it } from 'vitest';
import { count, displayPath, fileSize, isResetWord, names } from './format';

describe('format', () => {
  it('writes sizes in units of 1024 with one decimal', () => {
    expect([fileSize(1), fileSize(512), fileSize(50_541_363), fileSize(2 * 1024 ** 3)]).toEqual([
      '1 octet',
      '512 octets',
      '48,2 Mo',
      '2 Go',
    ]);
  });

  it('writes paths as the terminal does', () => {
    expect(displayPath('/home/camille/.local/share/bosco', '/home/camille')).toBe('~/.local/share/bosco');
    expect(displayPath('/srv/bosco', '/home/camille')).toBe('/srv/bosco');
  });

  it('counts and names in French', () => {
    expect([count(1, 'session'), count(214, 'session'), names(['pro', 'perso']), names(['a', 'b', 'c'])]).toEqual([
      '1 session',
      '214 sessions',
      'pro et perso',
      'a, b et c',
    ]);
  });

  it('CA-REGL-30 · takes the reset word whatever its case or its accents', () => {
    expect(['RÉINITIALISER', 'reinitialiser', ' Réinitialiser '].every(isResetWord)).toBe(true);
    expect(['réinitialise', 'oui', ''].some(isResetWord)).toBe(false);
  });
});
