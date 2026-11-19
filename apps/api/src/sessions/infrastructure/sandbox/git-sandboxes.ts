// Bacs à sable des sessions : un dossier par session, gardé hors du conteneur. repo/ est un clone
// autonome du dépôt du projet principal (sans liens physiques : aucun objet partagé avec le dépôt du poste), repo-1/,
// repo-2/… ceux des autres projets de la session, home/ le dossier personnel de l'agent. Chaque clone se monte au même
// chemin que son dépôt du poste, et les conversations du projet principal dans le profil des bacs à sable, une source
// surveillée : le fil se lit en direct et se range avec son projet.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import type { SandboxAccess } from '../../../shared/domain/profile-access.ts';
import type { Sandboxes, SandboxState, StartedSandbox, TurnLaunch } from '../../application/pilot.service.ts';
import { SandboxError, sandboxKeyOf, type SandboxServices } from '../../domain/sandbox.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);
/** L'agent a pu écrire dans le clone : Bosco n'y lance git qu'avec ses hooks et sa surveillance de fichiers coupés */
const SAFE = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false'];

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, [...SAFE, ...args], { cwd, maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

/** Point de départ d'une copie : une branche du dépôt du poste, le commit d'un worktree détaché, sinon HEAD. */
function startPoint(startBranch: null | string): string {
  if (!startBranch) return 'HEAD';
  return /^[0-9a-f]{40}$/.test(startBranch) ? startBranch : `origin/${startBranch}`;
}

/** Dossier d'un projet tel que Claude Code le nomme : le chemin, chaque caractère hors lettres et chiffres en « - ». */
function projectDir(path: string): string {
  return path.replaceAll(/[^a-zA-Z0-9]/g, '-');
}

/** Conteneurs des bacs à sable : l'isolation des agents du worker, branchée au point de composition. */
export interface SandboxContainers {
  ensure(spec: {
    dir: string;
    key: string;
    mounts: { from: string; to: string }[];
    /** Chemins des projets du bac à sable : leurs domaines propres s'ajoutent à la liste générale */
    projects: readonly string[];
    /** Copie du projet principal, dont le fichier Compose donne les services de données */
    servicesFrom: string;
    workdir: string;
  }): Promise<SandboxServices>;
  /** env : noms des variables du tour transmises au conteneur, leur valeur venant de l'environnement de la commande */
  exec(key: string, env?: readonly string[]): TurnLaunch;
  remove(key: string, dir: string): Promise<void>;
  state(key: string): Promise<SandboxState>;
  stop(key: string, dir: string): Promise<void>;
  unavailable(): Promise<null | string>;
}

export class GitSandboxes implements Sandboxes {
  readonly profile: string;

  constructor(
    private readonly root: string,
    private readonly containers: SandboxContainers,
    /**
     * Accès à l'abonnement Claude d'un profil : sa connexion, copiée dans le dossier personnel de l'agent, ou le fichier
     * de son jeton longue durée, qui n'est jamais copié (le tour le passe par son environnement)
     */
    private readonly accessOf: (profile: string) => Promise<SandboxAccess>,
  ) {
    this.profile = join(root, 'profile');
  }

  private dirOf(sessionId: string): string {
    return join(this.root, sessionId);
  }

  /** Clone d'une copie : celui du projet principal (0), puis ceux des autres projets dans l'ordre. */
  private repoOf(sessionId: string, copy: number): string {
    return join(this.dirOf(sessionId), copy === 0 ? 'repo' : `repo-${copy}`);
  }

  private keyOf(sessionId: string): string {
    return sandboxKeyOf(sessionId);
  }

  unavailable(): Promise<null | string> {
    return this.containers.unavailable();
  }

  async currentBranch(projectRoot: string): Promise<null | string> {
    const branch = await git(projectRoot, 'rev-parse', '--abbrev-ref', 'HEAD').catch(() => null);
    return branch && branch !== 'HEAD' ? branch : null;
  }

  async uncommitted(projectRoot: string): Promise<null | number> {
    const status = await git(projectRoot, 'status', '--porcelain').catch(() => null);
    return status === null ? null : status.split('\n').filter(Boolean).length;
  }

  async prepare(input: {
    branch: string;
    profile: string;
    projects: readonly { root: string; startBranch: null | string }[];
    sessionId: string;
  }): Promise<{ base: string; from: string }[]> {
    // La même branche de session dans chaque projet : un nom déjà pris dans l'un d'eux est refusé
    for (const { root } of input.projects) {
      const exists = await git(root, 'rev-parse', '--verify', '--quiet', `refs/heads/${input.branch}`)
        .then(() => true)
        .catch(() => false);
      if (exists)
        throw new SandboxError(
          'invalidSandboxBranch',
          `La branche ${input.branch} existe déjà dans ${basename(root)}.`,
        );
    }
    const dir = this.dirOf(input.sessionId);
    await rm(dir, { recursive: true, force: true });
    await mkdir(join(dir, 'home', '.claude'), { recursive: true });
    const copies = [];
    for (const [copy, { root, startBranch }] of input.projects.entries()) {
      const repo = this.repoOf(input.sessionId, copy);
      await git(this.root, 'clone', '--quiet', '--no-hardlinks', root, repo);
      const from = startBranch ?? (await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'));
      const start = startPoint(startBranch);
      await git(repo, 'checkout', '--quiet', '-B', input.branch, start).catch(() => {
        throw new SandboxError(
          'invalidSandboxBranch',
          `La branche de départ ${from} n’existe pas dans ${basename(root)}.`,
        );
      });
      copies.push({ base: await git(repo, 'rev-parse', 'HEAD'), from });
    }
    const principal = input.projects[0]?.root ?? '';
    // L'accès à l'abonnement, et rien d'autre du profil : ni serveurs, ni connecteurs, ni réglages. Un jeton longue durée
    // n'est pas copié : chaque tour le reçoit par son environnement
    const access = await this.accessOf(input.profile);
    if (access.kind === 'login') await cp(access.credentials, join(dir, 'home', '.claude', '.credentials.json'));
    await writeFile(join(dir, 'home', '.claude', 'settings.json'), JSON.stringify({ autoUpdates: false }));
    // Les points de montage existent avant le conteneur : sinon Docker les crée en root, et la suppression échoue
    const project = projectDir(principal);
    await mkdir(join(this.profile, 'projects', project), { recursive: true });
    await mkdir(join(dir, 'home', '.claude', 'projects', project), { recursive: true });
    return copies;
  }

  async ensure(
    sessionId: string,
    projectRoots: readonly string[],
    env: readonly string[] = [],
  ): Promise<StartedSandbox> {
    const dir = this.dirOf(sessionId);
    // Sans ses copies, le conteneur monterait des dossiers vides que Docker créerait en root : la session ne se reprend
    // plus
    if (projectRoots.some((_, copy) => !existsSync(this.repoOf(sessionId, copy))))
      throw new SandboxError(
        'sandboxRemoved',
        'La copie du projet de ce bac à sable a disparu : la session ne se reprend plus.',
      );
    const projectRoot = projectRoots[0] ?? '';
    const project = projectDir(projectRoot);
    const key = this.keyOf(sessionId);
    const services = await this.containers.ensure({
      dir,
      key,
      projects: projectRoots,
      servicesFrom: this.repoOf(sessionId, 0),
      workdir: projectRoot,
      mounts: [
        ...projectRoots.map((root, copy) => ({ from: this.repoOf(sessionId, copy), to: root })),
        { from: join(dir, 'home'), to: '/home/agent' },
        { from: join(this.profile, 'projects', project), to: `/home/agent/.claude/projects/${project}` },
      ],
    });
    return { launch: this.containers.exec(key, env), services };
  }

  state(sessionId: string): Promise<SandboxState> {
    return this.containers.state(this.keyOf(sessionId));
  }

  stop(sessionId: string): Promise<void> {
    return this.containers.stop(this.keyOf(sessionId), this.dirOf(sessionId));
  }

  async remove(sessionId: string): Promise<void> {
    await this.containers.remove(this.keyOf(sessionId), this.dirOf(sessionId));
    await rm(this.dirOf(sessionId), { recursive: true, force: true });
  }

  /**
   * Le travail en cours est commité dans le clone, puis la branche rejoint le dépôt du poste par un fetch, qui
   * n'exécute ni les hooks ni la configuration du clone. La branche courante du poste n'est jamais touchée, ni une
   * branche du poste qui a avancé de son côté : la récupération prend alors un autre nom.
   */
  async retrieve(input: { branch: string; copy: number; projectRoot: string; sessionId: string }): Promise<string> {
    const repo = this.repoOf(input.sessionId, input.copy);
    await git(repo, 'add', '--all');
    if (await git(repo, 'status', '--porcelain'))
      await git(
        repo,
        '-c',
        'user.name=Bosco',
        '-c',
        'user.email=bosco@localhost',
        'commit',
        '--quiet',
        '-m',
        'Travail en cours de la session',
      );
    const head = await git(repo, 'rev-parse', 'HEAD');
    const temporary = `refs/bosco/sandboxes/${this.keyOf(input.sessionId)}-${input.copy}`;
    await git(input.projectRoot, 'fetch', '--quiet', '--no-tags', repo, `+${input.branch}:${temporary}`);
    try {
      const target = await this.targetOf(input.projectRoot, input.branch, head);
      await git(input.projectRoot, 'update-ref', `refs/heads/${target}`, head);
      return target;
    } finally {
      await git(input.projectRoot, 'update-ref', '-d', temporary).catch(() => undefined);
    }
  }

  /** Fichiers changés depuis le départ de la branche, commités ou non, nouveaux compris. */
  async work(input: { base: string; copy: number; sessionId: string }): Promise<number> {
    const repo = this.repoOf(input.sessionId, input.copy);
    const [committed, status] = await Promise.all([
      git(repo, 'diff', '--name-only', input.base, 'HEAD'),
      git(repo, 'status', '--porcelain'),
    ]);
    const files = new Set([
      ...committed.split('\n').filter(Boolean),
      ...status
        .split('\n')
        .filter(Boolean)
        .map((line) => line.slice(3)),
    ]);
    return files.size;
  }

  /** La branche du même nom si on peut l'avancer sans perte, sinon le premier nom libre (« bosco/s-…-2 »). */
  private async targetOf(root: string, branch: string, head: string): Promise<string> {
    const current = await git(root, 'symbolic-ref', '--quiet', 'HEAD').catch(() => '');
    for (let index = 1; ; index += 1) {
      const name = index === 1 ? branch : `${branch}-${index}`;
      if (current === `refs/heads/${name}`) continue;
      const tip = await git(root, 'rev-parse', '--verify', '--quiet', `refs/heads/${name}`).catch(() => null);
      if (!tip) return name;
      const ahead = await git(root, 'merge-base', '--is-ancestor', tip, head)
        .then(() => true)
        .catch(() => false);
      if (ahead) return name;
    }
  }

  async refusals(sessionId: string): Promise<{ at: Date; host: string }[]> {
    const content = await readFile(join(this.dirOf(sessionId), 'egress', 'refusals.jsonl'), 'utf8').catch(() => '');
    return content
      .split('\n')
      .filter(Boolean)
      .flatMap((line) => {
        try {
          const { at, host } = JSON.parse(line) as { at: string; host: string };
          return [{ at: new Date(at), host }];
        } catch {
          return [];
        }
      });
  }
}
