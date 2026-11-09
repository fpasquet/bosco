// `make desktop-package` : le paquet .deb de l'application du poste (Linux). Il embarque le service construit, l'interface
// et le Node 26 qui lance ce script : une fois installé, Bosco ne dépend plus du dépôt ni du Node du poste. Le service,
// l'interface et l'application doivent être construits (`make desktop-package` lance `make build` avant).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { arch } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = resolve(app, '..', '..');
const out = join(app, 'out');
const stage = join(out, 'stage');
const NODE_MAJOR = 26;
const requireFromApp = createRequire(join(app, 'package.json'));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// Node embarqué : celui qui lance ce script, le même qui a construit le moteur SQLite du service
if (Number(process.versions.node.split('.')[0]) < NODE_MAJOR) fail(`Node ${NODE_MAJOR} is required (nvm use).`);
const built = [
  'apps/api/dist/main.js',
  'apps/web/.next/BUILD_ID',
  'packages/domain/dist/index.js',
  'apps/desktop/dist/main.js',
];
const missing = built.filter((file) => !existsSync(join(repo, file)));
if (missing.length > 0) fail(`Build first (make build), missing: ${missing.join(', ')}`);

rmSync(stage, { recursive: true, force: true });
// Un seul paquet dans out : celui que `make desktop-update` installe
for (const file of existsSync(out) ? readdirSync(out) : []) {
  if (file.endsWith('.deb')) rmSync(join(out, file));
}

// Version du paquet : celle de l'application, suivie de la date et du commit (« 0.1.0+git20261109073400.3118cb5 »),
// pour que chaque construction soit plus récente que la précédente pour apt ; « .dev… » si le dépôt a des changements
function git(...args) {
  // Le git du poste, celui du dépôt construit
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
}
const commit = git('log', '-1', '--format=%cd.%h', '--date=format:%Y%m%d%H%M%S');
const changed = git('status', '--porcelain', '--untracked-files=no') !== '';
const now = new Date().toISOString().replaceAll(/\D/g, '').slice(0, 14);
const desktop = readJson(join(app, 'package.json'));
const dev = changed ? '.dev' + now : '';
const version = `${desktop.version}+git${commit}${dev}`;

// 1. Le service : une copie réduite du dépôt (service, interface, contrats), installée sans les outils de développement
const service = join(stage, 'service');
const copy = (from, to = from, filter = undefined) =>
  cpSync(join(repo, from), join(service, to), { recursive: true, filter });
const root = readJson(join(repo, 'package.json'));
delete root.scripts;
mkdirSync(service, { recursive: true });
writeFileSync(join(service, 'package.json'), JSON.stringify(root, null, 2));
// Les mêmes réglages que le dépôt (le fichier de verrouillage les vérifie), avec ses trois paquets seulement
writeFileSync(
  join(service, 'pnpm-workspace.yaml'),
  readFileSync(join(repo, 'pnpm-workspace.yaml'), 'utf8').replace(
    /^packages:\n(?: {2}- .*\n)+/m,
    'packages:\n  - apps/api\n  - apps/web\n  - packages/domain\n',
  ),
);
copy('pnpm-lock.yaml');
copy('patches');
for (const file of ['package.json', 'dist']) copy(join('apps/api', file));
for (const file of ['package.json', 'dist']) copy(join('packages/domain', file));
for (const file of ['package.json', 'public']) copy(join('apps/web', file));
// La configuration de Next.js en JavaScript : lire next.config.ts demanderait le compilateur SWC (près de 100 Mo)
const nextConfig = readFileSync(join(repo, 'apps/web/next.config.ts'), 'utf8');
const { transpileModule, ModuleKind, ScriptTarget } = requireFromApp('typescript');
const compilerOptions = { module: ModuleKind.ESNext, target: ScriptTarget.ES2024 };
writeFileSync(join(service, 'apps/web/next.config.mjs'), transpileModule(nextConfig, { compilerOptions }).outputText);
// L'interface construite, sans le cache de construction ni les fichiers du mode développement
const skipped = new Set(['cache', 'dev', 'types', 'diagnostics'].map((dir) => join(repo, 'apps/web/.next', dir)));
copy('apps/web/.next', 'apps/web/.next', (source) => !skipped.has(source));
// Le pnpm du poste, celui qui lance `make desktop-package`
// eslint-disable-next-line sonarjs/no-os-command-from-path
execFileSync('pnpm', ['install', '--prod', '--frozen-lockfile', '--prefer-offline', '--config.node-linker=hoisted'], {
  cwd: service,
  stdio: 'inherit',
});
// Ce que le service ne charge jamais : sources du moteur SQLite et ses moteurs des autres systèmes, compilateur et
// optimiseur d'images de Next.js, outil de test, cartes de sources et déclarations de types des dépendances
const modules = join(service, 'node_modules');
const unused = [
  'better-sqlite3/deps',
  'better-sqlite3/src',
  'playwright',
  'playwright-core',
  '@playwright',
  '@img',
  'sharp',
];
for (const dir of [...unused, ...readdirSync(join(modules, '@next')).map((name) => `@next/${name}`)]) {
  if (dir !== '@next/env') rmSync(join(modules, dir), { recursive: true, force: true });
}
const prebuilds = join(modules, 'better-sqlite3', 'prebuilds');
for (const file of readdirSync(prebuilds)) {
  if (file !== `linux-${arch()}.node`) rmSync(join(prebuilds, file));
}
for (const file of readdirSync(modules, { recursive: true })) {
  if (/\.(?:map|d\.[cm]?ts)$/.test(file)) rmSync(join(modules, file), { force: true });
}
for (const file of ['pnpm-lock.yaml', 'pnpm-workspace.yaml', 'patches'])
  rmSync(join(service, file), { recursive: true });

// 2. Node 26 et sa licence
const node = join(stage, 'node');
mkdirSync(join(node, 'bin'), { recursive: true });
cpSync(process.execPath, join(node, 'bin', 'node'));
const license = join(dirname(process.execPath), '..', 'LICENSE');
if (existsSync(license)) cpSync(license, join(node, 'LICENSE'));

// 3. L'application : son code construit et ses images, sans dépendance à l'exécution
const shell = join(stage, 'app');
mkdirSync(shell, { recursive: true });
cpSync(join(app, 'dist'), join(shell, 'dist'), { recursive: true, filter: (source) => !source.endsWith('.test.js') });
cpSync(join(app, 'assets'), join(shell, 'assets'), { recursive: true });
writeFileSync(
  join(shell, 'package.json'),
  JSON.stringify(
    {
      name: 'bosco-desktop',
      productName: 'Bosco',
      version,
      description: 'Tes sessions Claude Code, au même endroit',
      type: 'module',
      main: 'dist/main.js',
      // Nom de l'entrée du menu des applications : le bureau y rattache la fenêtre et l'icône de la barre système
      desktopName: 'bosco-desktop.desktop',
      author: desktop.author,
      homepage: 'https://github.com/fpasquet/bosco',
    },
    null,
    2,
  ),
);

// 4. Le paquet .deb : l'exécutable bosco-desktop dans /opt/Bosco, son entrée dans le menu des applications, et le bac à
// sable d'Electron configuré à l'installation (chrome-sandbox appartient à root, avec le bit SUID)
const electron = requireFromApp('electron/package.json');
const { build, Platform } = requireFromApp('electron-builder');
const artifacts = await build({
  targets: Platform.LINUX.createTarget(['deb']),
  config: {
    appId: 'dev.bosco.desktop',
    productName: 'Bosco',
    executableName: 'bosco-desktop',
    artifactName: `bosco-desktop_${version}_\${arch}.\${ext}`,
    electronVersion: electron.version,
    electronDist: join(dirname(requireFromApp.resolve('electron/package.json')), 'dist'),
    directories: { app: shell, output: out },
    asar: false,
    npmRebuild: false,
    nodeGypRebuild: false,
    // Le service et Node copiés tels quels : les ressources d'electron-builder écarteraient les node_modules du service
    afterPack: ({ appOutDir }) => {
      for (const [from, to] of [
        [service, 'service'],
        [node, 'node'],
      ]) {
        cpSync(from, join(appOutDir, 'resources', to), { recursive: true, verbatimSymlinks: true });
      }
    },
    linux: {
      icon: join(app, 'assets', 'icon-256.png'),
      category: 'Development',
      synopsis: 'Tes sessions Claude Code, au même endroit',
      description: "Application du poste de Bosco : le service, l'interface, la barre système et les notifications.",
      syncDesktopName: true,
    },
    // La version complète, date et commit compris : electron-builder n'en garderait que « 0.1.0 »
    deb: { compression: 'xz', fpm: ['--version', version] },
  },
});
for (const artifact of artifacts) console.log(`\nInstall it with: sudo apt install ${artifact}`);
