// Agent et copies factices des scénarios (BOSCO_TEST=1) : ni Docker ni git, un compte rendu écrit d'avance. Les
// scénarios vérifient le parcours d'une tâche ; l'agent réel se vérifie sur le poste (make claude-compat).
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentRun, AgentRunner, AgentSpec, WorkerHealth, Workspaces } from '../../application/ports.ts';
import { projectDir } from './docker-agent-runner.ts';

/** Fil écrit d'avance d'une session d'agent, rattaché au dépôt comme le fait le worker réel. */
function transcriptOf(spec: AgentSpec, cwd: string, report: string): string {
  const at = new Date().toISOString();
  const base = { sessionId: `scripted-${spec.taskId}`, cwd, gitBranch: spec.workspace.branch, timestamp: at };
  return [
    { ...base, type: 'user', uuid: 'u1', message: { role: 'user', content: spec.prompt } },
    {
      ...base,
      type: 'assistant',
      uuid: 'a1',
      message: { id: 'm1', model: spec.model, role: 'assistant', content: [{ type: 'text', text: report }] },
    },
  ]
    .map((line) => JSON.stringify(line))
    .join('\n');
}

export class ScriptedAgentRunner implements AgentRunner, WorkerHealth {
  /** Indisponibilité simulée par les scénarios (E5c) */
  unavailable: null | string = null;

  /** Remise à zéro des scénarios : un agent lancé avant ne garde plus sa session */
  private epoch = 0;

  constructor(private readonly profile: null | { onSessionSaved: () => void; path: string } = null) {}

  /** Oublie les agents en cours et les sessions gardées : le scénario suivant part d'un profil vide. */
  async forget(): Promise<void> {
    this.epoch += 1;
    if (this.profile) await rm(join(this.profile.path, 'projects'), { recursive: true, force: true });
  }

  check(): Promise<null | string> {
    return Promise.resolve(this.unavailable);
  }

  start(spec: AgentSpec): Promise<AgentRun> {
    let stopped = false;
    // Les services du fichier du dépôt sont « prêts » aussitôt : leur lancement réel se vérifie sur le poste
    if (spec.services.length > 0)
      spec.onServices(
        spec.services.map((service) => ({
          name: service.name,
          image: service.image ?? '',
          error: null,
          readySeconds: 1,
        })),
      );
    const events = (async function* () {
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield { kind: 'session' as const, sessionId: `scripted-${spec.taskId}` };
      yield {
        kind: 'usage' as const,
        model: spec.model,
        usage: { input: 9000, output: 6000, cacheCreation: 5000, cacheRead: 41_000 },
      };
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (stopped) return;
      yield {
        kind: 'result' as const,
        ok: true,
        report: `Fait : ${spec.prompt.split('\n')[0]}`,
        stop: 'success' as const,
        turns: 14,
      };
    })();
    const profile = this.profile;
    const epoch = this.epoch;
    const keep = async () => {
      if (!profile || epoch !== this.epoch) return;
      const cwd = spec.folder ? join(spec.repositoryRoot, spec.folder) : spec.repositoryRoot;
      const dir = join(profile.path, 'projects', projectDir(cwd));
      await mkdir(dir, { recursive: true });
      await writeFile(
        join(dir, `scripted-${spec.taskId}.jsonl`),
        transcriptOf(spec, cwd, `Fait : ${spec.prompt.split('\n')[0]}`),
      );
      profile.onSessionSaved();
    };
    return Promise.resolve({
      events,
      finished: () => (stopped ? Promise.resolve() : keep()),
      stop: () => {
        stopped = true;
        return Promise.resolve();
      },
    });
  }
}

export const scriptedWorkspaces: Workspaces = {
  cleanupAll: () => Promise.resolve(),
  prepare: ({ branch, id }) => Promise.resolve({ branch, dir: `scripted-${id}` }),
  collect: () =>
    Promise.resolve({
      base: 'scripted-base',
      changes: { files: 2, added: 38, removed: 4 },
      from: 'main',
      proposals: [],
    }),
  remove: () => Promise.resolve(),
};
