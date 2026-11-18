// La version d'une release, écrite partout où elle se lit : le dépôt (source unique, lue par le service et
// l'application du poste), l'application du poste et l'application Android (version et versionCode).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { versionCode } from './version.ts';

type Json = Record<string, unknown>;

function readJson(file: string): Json {
  return JSON.parse(readFileSync(file, 'utf8')) as Json;
}

function writeJson(file: string, value: Json): void {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** Fichiers modifiés, chemins relatifs au dépôt. */
export const VERSION_FILES = ['package.json', 'apps/desktop/package.json', 'apps/mobile/app.json'] as const;

export function setVersion(repo: string, version: string): void {
  const code = versionCode(version);
  for (const file of ['package.json', 'apps/desktop/package.json']) {
    const path = join(repo, file);
    const manifest = readJson(path);
    // La version juste après le nom, comme npm la place
    const { name, ...rest } = manifest;
    delete rest.version;
    writeJson(path, { name, version, ...rest });
  }
  const appPath = join(repo, 'apps/mobile/app.json');
  const app = readJson(appPath) as { expo: Json & { android?: Json } };
  app.expo.version = version;
  app.expo.android = { ...app.expo.android, versionCode: code };
  writeJson(appPath, app);
}

/** Version du dépôt, celle de package.json à la racine. */
export function repoVersion(repo: string): string {
  const { version } = readJson(join(repo, 'package.json'));
  return typeof version === 'string' ? version : '0.0.0';
}
