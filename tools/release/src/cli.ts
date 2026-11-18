// Commandes du workflow Release, lancées depuis la racine du dépôt :
//   node tools/release/src/cli.ts plan --channel beta [--version 0.3.0]   → affiche la version de la release
//   node tools/release/src/cli.ts apply 0.3.0-beta.1 --notes notes.md     → écrit la version, CHANGELOG.md et les notes
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { setVersion, VERSION_FILES } from './files.ts';
import { type Channel, formatVersion, parseVersion, planVersion } from './version.ts';

const repo = resolve(import.meta.dirname, '..', '..', '..');
const cliff = join(repo, 'node_modules', '.bin', 'git-cliff');

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { channel: { type: 'string', default: 'stable' }, notes: { type: 'string' }, version: { type: 'string' } },
});
const [command, argument] = positionals;

if (command === 'plan') {
  const channel = values.channel;
  if (channel !== 'stable' && channel !== 'beta') throw new Error(`Unknown channel: ${channel}`);
  // Le git du poste ou du runner
  const tags = run('git', ['tag', '--list', 'v*']).split('\n').filter(Boolean);
  const bumped = run(cliff, ['--bumped-version']);
  console.log(planVersion({ bumped, channel: channel satisfies Channel, requested: values.version ?? '', tags }));
} else if (command === 'apply' && argument) {
  const version = formatVersion(parseVersion(argument));
  setVersion(repo, version);
  // Les fichiers réécrits retrouvent la mise en forme du dépôt
  run(join(repo, 'node_modules', '.bin', 'prettier'), ['--write', ...VERSION_FILES]);
  run(cliff, ['--tag', `v${version}`, '--output', 'CHANGELOG.md']);
  if (values.notes) {
    const notes = run(cliff, ['--unreleased', '--tag', `v${version}`, '--strip', 'header']);
    writeFileSync(resolve(values.notes), `${notes}\n`);
  }
  console.log(version);
} else {
  console.error('Usage: cli.ts plan --channel stable|beta [--version X.Y.Z] | apply <version> [--notes <file>]');
  process.exit(1);
}
