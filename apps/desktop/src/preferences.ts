// Choix gardés par l'application du poste : se relier au service ou le remplacer (E17b).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface Preferences {
  /** Un service Bosco tournait déjà : s'y relier (par défaut) ou le remplacer */
  service: 'attach' | 'own' | null;
}

const DEFAULTS: Preferences = { service: null };

export function loadPreferences(dir: string): Preferences {
  try {
    const content = readFileSync(join(dir, 'preferences.json'), 'utf8');
    return { ...DEFAULTS, ...(JSON.parse(content) as Partial<Preferences>) };
  } catch {
    return DEFAULTS;
  }
}

export function savePreferences(dir: string, preferences: Preferences): void {
  const file = join(dir, 'preferences.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(preferences, null, 2)}\n`);
}
