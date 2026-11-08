// Suggestions de l'éditeur (E2h, CA-SESS-99) : les fichiers suivis du dépôt après « @ », les commandes et skills du
// profil et du dépôt après « / ». Lus sur le disque, sans rien modifier.
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { promisify } from 'node:util';
import type { Suggestion, Suggestions } from '../../application/suggestion.service.ts';

const run = promisify(execFile);
const LIMIT = 8;
const FILES_TTL_MS = 30_000;
const MAX_FILES = 20_000;
const SKIPPED = new Set(['.git', 'node_modules', 'dist', '.next', 'coverage', '.turbo']);

/** Commandes de Claude Code qui ont un sens dans un tour piloté ; celles du terminal (réglages, connexion…) n'y sont pas */
const BUILT_IN: Suggestion[] = [
  { value: 'compact', description: 'Résumer la conversation pour libérer le contexte', origin: 'commande' },
];

/** Fichiers d'un dossier sans git : parcours limité, sans les dossiers de dépendances ni de build. */
async function walk(root: string): Promise<string[]> {
  const files: string[] = [];
  const queue = [root];
  while (queue.length > 0 && files.length < MAX_FILES) {
    const dir = queue.shift()!;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (SKIPPED.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) queue.push(path);
      else if (entry.isFile()) files.push(relative(root, path));
    }
  }
  return files;
}

/** Le plus proche d'abord : le nom qui commence par le texte, puis le nom qui le contient, puis le chemin. */
function rank(path: string, query: string): number {
  const name = basename(path).toLowerCase();
  const lower = path.toLowerCase();
  if (!query) return 3;
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  if (lower.includes(query)) return 2;
  return -1;
}

/** Description d'un skill ou d'une commande : son en-tête (description:), sinon sa première ligne de texte. */
async function describe(file: string): Promise<null | string> {
  let content: string;
  try {
    content = await readFile(file, 'utf8');
  } catch {
    return null;
  }
  const end = content.startsWith('---\n') ? content.indexOf('\n---', 4) : -1;
  const front = end > 0 ? content.slice(4, end) : '';
  const line = front.split('\n').find((entry) => entry.startsWith('description:'));
  const description = line
    ?.slice('description:'.length)
    .trim()
    .replace(/^["']|["']$/g, '');
  if (description) return description.length > 90 ? `${description.slice(0, 89)}…` : description;
  const body = end > 0 ? content.slice(end + 4) : content;
  return (
    body
      .split('\n')
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .find(Boolean) ?? null
  );
}

/** Commandes (`commands/*.md`) et skills (`skills/<nom>/SKILL.md`) d'un dossier de configuration. */
async function commandsIn(dir: string, origin: string): Promise<Suggestion[]> {
  const found: Suggestion[] = [];
  try {
    for (const name of await readdir(join(dir, 'commands')))
      if (name.endsWith('.md'))
        found.push({
          value: name.slice(0, -3),
          description: await describe(join(dir, 'commands', name)),
          origin: `commande · ${origin}`,
        });
  } catch {
    // pas de commandes
  }
  try {
    for (const entry of await readdir(join(dir, 'skills'), { withFileTypes: true }))
      if (entry.isDirectory() || entry.isSymbolicLink())
        found.push({
          value: entry.name,
          description: await describe(join(dir, 'skills', entry.name, 'SKILL.md')),
          origin: `skill · ${origin}`,
        });
  } catch {
    // pas de skills
  }
  return found;
}

export class DiskSuggestions implements Suggestions {
  private readonly cache = new Map<string, { at: number; list: string[] }>();

  private async listFiles(cwd: string): Promise<string[]> {
    const cached = this.cache.get(cwd);
    if (cached && Date.now() - cached.at < FILES_TTL_MS) return cached.list;
    let list: string[];
    try {
      const { stdout } = await run('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
        cwd,
        maxBuffer: 32 * 1024 * 1024,
      });
      list = stdout.split('\n').filter(Boolean);
    } catch {
      list = await walk(cwd);
    }
    this.cache.set(cwd, { at: Date.now(), list });
    return list;
  }

  async filesOf(cwd: string, query: string): Promise<Suggestion[]> {
    const text = query.toLowerCase();
    const list = await this.listFiles(cwd);
    return list
      .map((path) => ({ path, score: rank(path, text) }))
      .filter(({ score }) => score >= 0)
      .toSorted((a, b) => a.score - b.score || a.path.length - b.path.length || a.path.localeCompare(b.path))
      .slice(0, LIMIT)
      .map(({ path }) => ({ value: path, description: null, origin: null }));
  }

  async commandsOf(
    profile: { label: string; path: string },
    repository: { name: string; root: string },
    query: string,
  ): Promise<Suggestion[]> {
    const text = query.toLowerCase();
    const all = [
      ...(await commandsIn(join(repository.root, '.claude'), `dépôt ${repository.name}`)),
      ...(await commandsIn(profile.path, `profil ${profile.label}`)),
      ...BUILT_IN,
    ];
    const seen = new Set<string>();
    return all
      .filter(({ value }) => !seen.has(value) && seen.add(value) && value.toLowerCase().includes(text))
      .toSorted(
        (a, b) => Number(!a.value.toLowerCase().startsWith(text)) - Number(!b.value.toLowerCase().startsWith(text)),
      )
      .slice(0, LIMIT);
  }
}
