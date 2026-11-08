// Agent et copies factices des scénarios (BOSCO_TEST=1) : ni Docker ni git, un compte rendu écrit d'avance. Les
// scénarios vérifient le parcours d'une tâche ; l'agent réel se vérifie sur le poste (make claude-compat).
import type { AgentRun, AgentRunner, AgentSpec, WorkerHealth, Workspaces } from '../../application/ports.ts';

export class ScriptedAgentRunner implements AgentRunner, WorkerHealth {
  /** Indisponibilité simulée par les scénarios (E5c) */
  unavailable: null | string = null;

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
    return Promise.resolve({
      events,
      finished: () => Promise.resolve(),
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
  collect: () => Promise.resolve({ files: 2, added: 38, removed: 4 }),
  remove: () => Promise.resolve(),
};
