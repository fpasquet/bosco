// Lanceur de l'AppImage : une AppImage n'installe rien, et son contenu est monté dans un dossier qui change à chaque
// lancement. Elle écrit donc elle-même son entrée dans le menu des applications, avec le chemin fixe du fichier AppImage
// et une copie de son icône hors du montage.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { desktopEntry } from './autostart.ts';

/** Même nom que l'entrée du paquet .deb : le bureau y rattache la fenêtre et l'icône de la barre système */
const ENTRY = 'bosco-desktop';

export function launcherFile(home: string): string {
  return join(home, '.local', 'share', 'applications', `${ENTRY}.desktop`);
}

export function launcherIcon(home: string): string {
  return join(home, '.local', 'share', 'icons', 'hicolor', '256x256', 'apps', `${ENTRY}.png`);
}

/** Un argument de la clé Exec d'une entrée de bureau : entre guillemets s'il contient un espace ou un caractère réservé. */
export function execArgument(argument: string): string {
  if (!/[\s"'\\`$<>~|&;*?#()]/.test(argument)) return argument;
  const escaped = argument.replaceAll(/["`$\\]/g, String.raw`\$&`);
  return `"${escaped}"`;
}

/**
 * Écrit (ou met à jour) l'entrée du menu des applications et son icône. Rien n'est réécrit quand l'entrée est déjà à
 * jour ; l'icône est recopiée à chaque fois, elle peut changer d'une version à l'autre.
 */
export function installLauncher(home: string, command: string, iconSource: string): void {
  const icon = launcherIcon(home);
  mkdirSync(dirname(icon), { recursive: true });
  copyFileSync(iconSource, icon);
  const file = launcherFile(home);
  const entry = desktopEntry(command, icon, false, ENTRY);
  if (existsSync(file) && readFileSync(file, 'utf8') === entry) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, entry);
}
