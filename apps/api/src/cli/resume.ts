// `bosco resume <session>` : une session d'un agent du worker se reprend dans un terminal. Son fil est réinstallé dans
// le profil Claude Code choisi (par défaut ~/.claude), puis Claude Code la reprend dans le dossier où elle travaillait.
import { copyFile, mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Le fil d'une session dans un profil : son fichier et son dossier de projet. */
export async function findSession(profile: string, sessionId: string): Promise<null | { dir: string; file: string }> {
  const projects = join(profile, 'projects');
  const dirs = await readdir(projects).catch(() => [] as string[]);
  for (const dir of dirs) {
    const files = await readdir(join(projects, dir)).catch(() => [] as string[]);
    if (files.includes(`${sessionId}.jsonl`)) return { dir, file: join(projects, dir, `${sessionId}.jsonl`) };
  }
  return null;
}

/** Réinstalle le fil dans le profil cible ; rend le dossier de travail de la session. */
export async function installSession(
  source: { dir: string; file: string },
  profile: string,
  sessionId: string,
): Promise<string> {
  const target = join(profile, 'projects', source.dir);
  await mkdir(target, { recursive: true });
  await copyFile(source.file, join(target, `${sessionId}.jsonl`));
  const content = await readFile(source.file, 'utf8');
  const cwd = /"cwd":\s*"((?:[^"\\]|\\.)*)"/.exec(content)?.[1];
  return cwd ? (JSON.parse(`"${cwd}"`) as string) : process.cwd();
}
