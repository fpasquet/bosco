// Ce que les scénarios ne voient pas : le nom court tiré de chaque forme de dossier de profil.
import { describe, expect, it } from 'vitest';
import { labelOf } from './source.ts';

describe('labelOf', () => {
  it.each([
    ['/home/dev/.claude-perso', 'perso'],
    ['/home/dev/.claude', 'claude'],
    ['/home/dev/.claude-pro/', 'pro'],
  ])('names %s after its folder', (path, label) => {
    expect(labelOf(path)).toBe(label);
  });
});
