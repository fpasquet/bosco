// Ce que les scénarios ne voient pas : l'entrée du menu des applications qu'écrit l'AppImage, avec le chemin fixe du
// fichier AppImage et une icône copiée hors de son montage.
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { execArgument, installLauncher, launcherFile, launcherIcon } from './launcher.ts';

function setup(): { home: string; icon: string } {
  const home = mkdtempSync(join(tmpdir(), 'bosco-launcher-'));
  const icon = join(home, 'icon-256.png');
  writeFileSync(icon, 'png');
  return { home, icon };
}

describe('the launcher of the AppImage', () => {
  it('writes the applications menu entry with the AppImage path and a copy of the icon', () => {
    const { home, icon } = setup();
    installLauncher(home, '/home/me/Apps/bosco.AppImage --no-sandbox', icon);
    const entry = readFileSync(launcherFile(home), 'utf8');
    expect(launcherFile(home)).toBe(join(home, '.local/share/applications/bosco-desktop.desktop'));
    expect(entry).toContain('Exec=/home/me/Apps/bosco.AppImage --no-sandbox\n');
    expect(entry).toContain(`Icon=${launcherIcon(home)}\n`);
    expect(entry).toContain('StartupWMClass=bosco-desktop\n');
    expect(entry).not.toContain('--hidden');
    expect(readFileSync(launcherIcon(home), 'utf8')).toBe('png');
  });

  it('leaves an entry that is already up to date untouched, and rewrites it when the AppImage moves', () => {
    const { home, icon } = setup();
    installLauncher(home, '/home/me/Apps/bosco.AppImage', icon);
    const written = statSync(launcherFile(home)).mtimeMs;
    installLauncher(home, '/home/me/Apps/bosco.AppImage', icon);
    expect(statSync(launcherFile(home)).mtimeMs).toBe(written);
    installLauncher(home, '/home/me/Applications/bosco.AppImage', icon);
    expect(readFileSync(launcherFile(home), 'utf8')).toContain('Exec=/home/me/Applications/bosco.AppImage\n');
  });

  it('quotes a path the Exec key could not read as is', () => {
    expect(execArgument('/home/me/Apps/bosco.AppImage')).toBe('/home/me/Apps/bosco.AppImage');
    expect(execArgument('/home/me/Mes Apps/bosco.AppImage')).toBe('"/home/me/Mes Apps/bosco.AppImage"');
    expect(execArgument('/home/me/$x/"a"')).toBe(String.raw`"/home/me/\$x/\"a\""`);
  });
});
