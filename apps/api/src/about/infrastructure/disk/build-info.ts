import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildInfo, BuildInfoSource, InstallKind } from '../../application/ports.ts';

/** Le git du système, par son chemin : jamais celui que donnerait un PATH modifié */
const GIT = '/usr/bin/git';

function readJson(file: string): null | Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Ce que Bosco sait de sa construction : build.json, écrit par le paquet de l'application du poste ; depuis le dépôt
 * (make dev, make start), la version de package.json et le commit courant. Lu une fois au démarrage.
 */
export class FileBuildInfo implements BuildInfoSource {
  private readonly info: BuildInfo;

  constructor(appRoot: string, install: InstallKind) {
    const build = readJson(join(appRoot, 'build.json'));
    const manifest = readJson(join(appRoot, 'package.json'));
    const version = typeof build?.version === 'string' ? build.version : manifest?.version;
    this.info = {
      version: typeof version === 'string' ? version : '0.0.0',
      commit: typeof build?.commit === 'string' ? build.commit : currentCommit(appRoot),
      release: build?.release === true,
      install,
    };
  }

  current(): BuildInfo {
    return this.info;
  }
}

/** Commit du dépôt d'où tourne le service ; null hors d'un dépôt git. */
function currentCommit(appRoot: string): null | string {
  try {
    return execFileSync(GIT, ['rev-parse', '--short', 'HEAD'], {
      cwd: appRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
  } catch {
    return null;
  }
}
