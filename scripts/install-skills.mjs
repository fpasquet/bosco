// pnpm skills:install : skills de skills-lock.json, aux versions épinglées, dans .claude/skills/ (non versionné).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { skills } = JSON.parse(readFileSync('skills-lock.json', 'utf8'));
const groups = new Map();
for (const [name, { source, ref }] of Object.entries(skills)) {
  if (!ref) throw new Error(`${name}: no ref in skills-lock.json, pin a commit`);
  const key = `${source}#${ref}`;
  groups.set(key, [...(groups.get(key) ?? []), name]);
}
for (const [source, names] of groups) {
  execFileSync('npx', ['-y', 'skills@1.7.6', 'add', source, '--skill', ...names, '-a', 'claude-code', '-y', '--copy'], {
    stdio: 'inherit',
  });
}
