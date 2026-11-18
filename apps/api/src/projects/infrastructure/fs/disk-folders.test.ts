// Ce que les scénarios ne voient pas : chacune des façons de déclarer un monodépôt, et un package.json illisible.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DiskFolders } from './disk-folders.ts';

function folder(files: Record<string, string>): string {
  const path = mkdtempSync(join(tmpdir(), 'bosco-folder-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(path, name), content);
  return path;
}

describe('DiskFolders.isMonorepo', () => {
  it.each([
    ['pnpm-workspace.yaml', { 'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n" }],
    ['workspaces in package.json', { 'package.json': JSON.stringify({ workspaces: ['packages/*'] }) }],
    ['workspaces as an object', { 'package.json': JSON.stringify({ workspaces: { packages: ['apps/*'] } }) }],
    ['turbo.json', { 'turbo.json': '{}' }],
    ['nx.json', { 'nx.json': '{}' }],
  ])('spots a monorepo by %s', async (_, files) => {
    const monorepo = await new DiskFolders().isMonorepo(folder(files));
    expect(monorepo).toBe(true);
  });

  it.each([
    ['a single package', { 'package.json': JSON.stringify({ name: 'site-clubs' }) }],
    ['an unreadable package.json', { 'package.json': '{ "workspaces": ' }],
    ['no manifest', {}],
  ])('leaves %s as a single project', async (_, files) => {
    const monorepo = await new DiskFolders().isMonorepo(folder(files));
    expect(monorepo).toBe(false);
  });
});
