// Ce que les scénarios ne voient pas : l'accès d'un profil selon ce qu'il a sur le disque, et les raisons d'un fichier
// de jeton qui ne sert pas (RF-REGL-07).
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { profileAccess, readToken, tokenFileProblem } from './claude-access.ts';

describe('access of a profile to its subscription', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bosco-access-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const profile = join(dir, '.claude-ultra');
  mkdirSync(profile);
  const token = join(dir, 'ultra-token');
  writeFileSync(token, 'sk-ant-oat01-fake\n');
  const empty = join(dir, 'empty');
  writeFileSync(empty, '  \n');

  it('CA-REGL-32 · has no access without a login or a declared token', async () => {
    const none = await profileAccess(profile, null);
    expect(none).toEqual({ kind: 'none', problem: null, tokenFile: null });
  });

  it('CA-REGL-32 · uses the login of the profile, unless a token is declared', async () => {
    const connected = join(dir, '.claude-pro');
    mkdirSync(connected);
    writeFileSync(join(connected, '.credentials.json'), '{}');
    const login = await profileAccess(connected, null);
    expect(login).toEqual({
      kind: 'login',
      credentials: join(connected, '.credentials.json'),
    });
    const declared = await profileAccess(connected, token);
    expect(declared).toEqual({ kind: 'token', tokenFile: token });
  });

  it('CA-REGL-32 · says why the file of a declared token does not serve', async () => {
    const readable = await tokenFileProblem(token);
    expect(readable).toBeNull();
    const emptyProblem = await tokenFileProblem(empty);
    expect(emptyProblem).toBe('Le fichier du jeton est vide.');
    const missingProblem = await tokenFileProblem(join(dir, 'missing'));
    expect(missingProblem).toBe('Le fichier du jeton est introuvable.');
    const folderProblem = await tokenFileProblem(profile);
    expect(folderProblem).toBe('Le fichier du jeton ne se lit pas.');
    const emptyToken = await profileAccess(profile, empty);
    expect(emptyToken).toEqual({
      kind: 'none',
      problem: 'Le fichier du jeton est vide.',
      tokenFile: empty,
    });
  });

  it('reads the token without its line break, and nothing from an empty file', () => {
    expect(readToken(token)).toBe('sk-ant-oat01-fake');
    expect(readToken(empty)).toBeNull();
    expect(readToken(join(dir, 'missing'))).toBeNull();
  });
});
