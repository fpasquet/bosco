// Ce que l'application ne montre pas à l'œil : elle remarque un paquet plus récent installé pendant qu'elle tourne.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { displayVersion, installedVersion, pendingUpdate, updateText } from './update.ts';

const NEWER = '0.1.0+git20261110093000.4c2e9b1';

describe('the installed package', () => {
  it('CA-APPS-10 · proposes the version installed on disk when it is not the running one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bosco-update-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'bosco-desktop', version: NEWER }));
    expect(installedVersion(dir)).toBe(NEWER);
    expect(installedVersion(join(dir, 'missing'))).toBeNull();
    expect(pendingUpdate('0.1.0+git20261109073400.3118cb5', NEWER)).toBe(NEWER);
    expect(pendingUpdate(NEWER, NEWER)).toBeNull();
    expect(pendingUpdate(NEWER, null)).toBeNull();
  });

  it('shows the version with its commit', () => {
    expect(displayVersion(NEWER)).toBe('0.1.0 · 4c2e9b1');
    expect(displayVersion('0.1.0')).toBe('0.1.0');
    expect(updateText(NEWER)).toEqual({
      title: 'Bosco a été mis à jour',
      body: 'La version 0.1.0 · 4c2e9b1 est installée : relance Bosco pour t’en servir.',
    });
  });
});
