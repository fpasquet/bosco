// « Lancer au démarrage » (E17a) : une entrée de démarrage automatique du bureau (~/.config/autostart), fenêtre fermée.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function autostartFile(home: string): string {
  return join(home, '.config', 'autostart', 'bosco.desktop');
}

/** Entrée de bureau qui lance l'application ; --hidden : dans la barre système seulement. */
export function desktopEntry(command: string, icon: string, hidden: boolean): string {
  return [
    '[Desktop Entry]',
    'Type=Application',
    'Name=Bosco',
    'Comment=Tes sessions Claude Code, au même endroit',
    `Exec=${command}${hidden ? ' --hidden' : ''}`,
    `Icon=${icon}`,
    'Terminal=false',
    'Categories=Development;',
    'StartupWMClass=Bosco',
    '',
  ].join('\n');
}

export function isAutostart(home: string): boolean {
  return existsSync(autostartFile(home));
}

export function setAutostart(home: string, enabled: boolean, command: string, icon: string): void {
  const file = autostartFile(home);
  if (!enabled) {
    rmSync(file, { force: true });
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, desktopEntry(command, icon, true));
}
