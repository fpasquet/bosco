// Bacs à sable des sessions (DT-37) : un dossier par session, gardé hors du conteneur. repo/ est un clone autonome du
// dépôt (sans liens physiques : aucun objet partagé avec le dépôt du poste), home/ le dossier personnel de l'agent.
// Le clone se monte au même chemin que le dépôt du poste, et les conversations de ce dépôt dans le profil des bacs à
// sable, une source surveillée : le fil se lit en direct et se range avec son dépôt.
import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Sandboxes, SandboxState, TurnLaunch } from '../../application/pilot.service.ts';
import { SandboxError } from '../../domain/sandbox.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);
/** L'agent a pu écrire dans le clone : Bosco n'y lance git qu'avec ses hooks et sa surveillance de fichiers coupés */
const SAFE = ['-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false'];

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, [...SAFE, ...args], { cwd, maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

/** Dossier d'un projet tel que Claude Code le nomme : le chemin, chaque caractère hors lettres et chiffres en « - ». */
function projectDir(path: string): string {
  return path.replaceAll(/[^a-zA-Z0-9]/g, '-');
}

/** Conteneurs des bacs à sable : l'isolation des agents du worker, branchée au point de composition. */
export interface SandboxContainers {
  ensure(spec: { dir: string; key: string; mounts: { from: string; to: string }[]; workdir: string }): Promise<void>;
  exec(key: string): TurnLaunch;
  remove(key: string): Promise<void>;
  state(key: string): Promise<SandboxState>;
  stop(key: string): Promise<void>;
  unavailable(): Promise<null | string>;
}

export class GitSandboxes implements Sandboxes {
  readonly profile: string;

  constructor(
    private readonly root: string,
    private readonly containers: SandboxContainers,
    /** Accès à l'abonnement Claude d'un profil, copié dans le dossier personnel de l'agent */
    private readonly credentialsOf: (profile: string) => Promise<string>,
  ) {
    this.profile = join(root, 'profile');
  }

  private dirOf(sessionId: string): string {
    return join(this.root, sessionId);
  }

  /** Nom court du conteneur : les premiers caractères de la session */
  private keyOf(sessionId: string): string {
    return sessionId
      .replaceAll(/[^a-z0-9]/gi, '')
      .slice(0, 12)
      .toLowerCase();
  }

  unavailable(): Promise<null | string> {
    return this.containers.unavailable();
  }

  async currentBranch(repositoryRoot: string): Promise<null | string> {
    const branch = await git(repositoryRoot, 'rev-parse', '--abbrev-ref', 'HEAD').catch(() => null);
    return branch && branch !== 'HEAD' ? branch : null;
  }

  async prepare(input: {
    branch: string;
    profile: string;
    repositoryRoot: string;
    sessionId: string;
    startBranch: null | string;
  }): Promise<{ base: string; from: string }> {
    const exists = await git(input.repositoryRoot, 'rev-parse', '--verify', '--quiet', `refs/heads/${input.branch}`)
      .then(() => true)
      .catch(() => false);
    if (exists) throw new SandboxError('invalidSandboxBranch', `La branche ${input.branch} existe déjà dans le dépôt.`);
    const dir = this.dirOf(input.sessionId);
    const repo = join(dir, 'repo');
    await rm(dir, { recursive: true, force: true });
    await mkdir(join(dir, 'home', '.claude'), { recursive: true });
    await git(this.root, 'clone', '--quiet', '--no-hardlinks', input.repositoryRoot, repo);
    const from = input.startBranch ?? (await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'));
    const start = input.startBranch ? `origin/${input.startBranch}` : 'HEAD';
    await git(repo, 'checkout', '--quiet', '-B', input.branch, start).catch(() => {
      throw new SandboxError('invalidSandboxBranch', `La branche de départ ${from} n’existe pas dans le dépôt.`);
    });
    const base = await git(repo, 'rev-parse', 'HEAD');
    // L'accès à l'abonnement, et rien d'autre du profil : ni serveurs, ni connecteurs, ni réglages
    const credentials = await this.credentialsOf(input.profile);
    await cp(credentials, join(dir, 'home', '.claude', '.credentials.json'));
    await writeFile(join(dir, 'home', '.claude', 'settings.json'), JSON.stringify({ autoUpdates: false }));
    await mkdir(join(this.profile, 'projects', projectDir(input.repositoryRoot)), { recursive: true });
    return { base, from };
  }

  async ensure(sessionId: string, repositoryRoot: string): Promise<TurnLaunch> {
    const dir = this.dirOf(sessionId);
    const project = projectDir(repositoryRoot);
    const key = this.keyOf(sessionId);
    await this.containers.ensure({
      dir,
      key,
      workdir: repositoryRoot,
      mounts: [
        { from: join(dir, 'repo'), to: repositoryRoot },
        { from: join(dir, 'home'), to: '/home/agent' },
        { from: join(this.profile, 'projects', project), to: `/home/agent/.claude/projects/${project}` },
      ],
    });
    return this.containers.exec(key);
  }

  state(sessionId: string): Promise<SandboxState> {
    return this.containers.state(this.keyOf(sessionId));
  }

  stop(sessionId: string): Promise<void> {
    return this.containers.stop(this.keyOf(sessionId));
  }

  async remove(sessionId: string): Promise<void> {
    await this.containers.remove(this.keyOf(sessionId));
    await rm(this.dirOf(sessionId), { recursive: true, force: true });
  }

  /**
   * Le travail en cours est commité dans le clone, puis la branche rejoint le dépôt du poste par un fetch, qui
   * n'exécute ni les hooks ni la configuration du clone. La branche courante du poste n'est jamais touchée, ni une
   * branche du poste qui a avancé de son côté : la récupération prend alors un autre nom (CA-SESS-112).
   */
  async retrieve(input: { branch: string; repositoryRoot: string; sessionId: string }): Promise<string> {
    const repo = join(this.dirOf(input.sessionId), 'repo');
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
    const temporary = `refs/bosco/sandboxes/${this.keyOf(input.sessionId)}`;
    await git(input.repositoryRoot, 'fetch', '--quiet', '--no-tags', repo, `+${input.branch}:${temporary}`);
    try {
      const target = await this.targetOf(input.repositoryRoot, input.branch, head);
      await git(input.repositoryRoot, 'update-ref', `refs/heads/${target}`, head);
      return target;
    } finally {
      await git(input.repositoryRoot, 'update-ref', '-d', temporary).catch(() => undefined);
    }
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
