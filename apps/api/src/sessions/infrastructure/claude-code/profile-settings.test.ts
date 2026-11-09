// Ce que les scénarios ne voient pas : les réglages de la personne gardés à l'identique, et un fichier illisible.
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileProfileSettings, UnreadableSettings } from './profile-settings.ts';

const endpoint = { secret: 's3cr3t', url: 'http://127.0.0.1:4870/api/hooks/perso' };
const own = {
  model: 'opus',
  hooks: { Stop: [{ hooks: [{ type: 'command', command: '~/.claude/hooks/peon.sh' }] }] },
};

function profile(settings?: string): string {
  const path = mkdtempSync(join(tmpdir(), 'bosco-settings-'));
  if (settings !== undefined) writeFileSync(join(path, 'settings.json'), settings);
  return path;
}

const read = (path: string): unknown => JSON.parse(readFileSync(join(path, 'settings.json'), 'utf8'));

describe('FileProfileSettings', () => {
  it('adds its six hooks next to the existing settings, keeps a copy, and removes only its own', async () => {
    const path = profile(JSON.stringify(own));
    const settings = new FileProfileSettings();
    const { backupPath } = await settings.install(path, endpoint, true);
    expect(backupPath && JSON.parse(readFileSync(backupPath, 'utf8'))).toEqual(own);
    const installed = read(path) as { hooks: Record<string, unknown[]>; model: string };
    expect([installed.model, Object.keys(installed.hooks).length, installed.hooks.Stop?.length]).toEqual([
      'opus',
      6,
      2,
    ]);
    expect(installed.hooks.PermissionRequest).toEqual([
      { hooks: [{ type: 'http', url: endpoint.url, headers: { Authorization: 'Bearer s3cr3t' } }] },
    ]);
    const installedNow = await settings.isInstalled(path, endpoint);
    expect(installedNow).toBe(true);
    await settings.uninstall(path, endpoint);
    expect(read(path)).toEqual(own);
  });

  it('installs once, even when installed again on another port', async () => {
    const path = profile();
    const settings = new FileProfileSettings();
    await settings.install(path, { ...endpoint, url: 'http://127.0.0.1:4880/api/hooks/perso' }, false);
    const { backupPath } = await settings.install(path, endpoint, true);
    const installed = read(path) as { hooks: Record<string, unknown[]> };
    expect([backupPath === null || existsSync(backupPath), installed.hooks.Stop?.length]).toEqual([true, 1]);
  });

  it('CA-SESS-105 · replaces the hooks of another Bosco of the workstation, and uninstalls only its own', async () => {
    const other = { type: 'http', url: 'http://127.0.0.1:4880/api/hooks/be974f42-3b96', headers: {} };
    const elsewhere = { type: 'http', url: 'https://hooks.example.dev/api/hooks/audit' };
    const path = profile(
      JSON.stringify({ hooks: { Stop: [{ hooks: [other] }], SessionEnd: [{ hooks: [other, elsewhere] }] } }),
    );
    const settings = new FileProfileSettings();
    const otherInstalled = await settings.isInstalled(path, endpoint);
    expect(otherInstalled).toBe(false);
    await settings.install(path, endpoint, false);
    const installed = read(path) as { hooks: Record<string, { hooks: { url?: string }[] }[]> };
    const urls = Object.values(installed.hooks).flatMap((groups) => groups.flatMap((group) => group.hooks));
    expect(urls.filter((hook) => hook.url === other.url)).toEqual([]);
    expect(installed.hooks.SessionEnd?.[0]?.hooks).toEqual([elsewhere]);
    await settings.uninstall(path, endpoint);
    expect(read(path)).toEqual({ hooks: { SessionEnd: [{ hooks: [elsewhere] }] } });
  });

  it('never rewrites settings it cannot read', async () => {
    const path = profile('{ "model": ');
    await expect(new FileProfileSettings().install(path, endpoint, true)).rejects.toBeInstanceOf(UnreadableSettings);
    expect(readFileSync(join(path, 'settings.json'), 'utf8')).toBe('{ "model": ');
  });
});
