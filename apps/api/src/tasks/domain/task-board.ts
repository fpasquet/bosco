import { NOT_STARTED, type Task, TaskError } from './task.ts';

/**
 * Règles qui lient les tâches entre elles (RF-TACH-03) : une tâche part quand toutes ses préalables sont validées ;
 * une préalable en échec, rejetée ou annulée fait échouer celles qui l'attendent, en cascade.
 */
export class TaskBoard {
  private readonly byId: Map<number, Task>;

  constructor(tasks: readonly Task[]) {
    this.byId = new Map(tasks.map((task) => [task.id, task]));
  }

  /** On ne peut pas attendre une tâche inconnue ou déjà en échec (RF-TACH-03, E6b). */
  checkPrerequisites(prerequisites: readonly number[], self: null | number = null): void {
    for (const id of prerequisites) {
      const prerequisite = this.byId.get(id);
      if (!prerequisite || id === self) throw new TaskError('unknownPrerequisite', `No task T-${id} to wait for`);
      if (['cancelled', 'failed', 'rejected'].includes(prerequisite.state))
        throw new TaskError('failedPrerequisite', `T-${id} has failed: relaunch it or remove it`);
    }
    if (self !== null && this.dependsOn(prerequisites, self))
      throw new TaskError('cyclicPrerequisite', `T-${self} cannot wait for a task that waits for it`);
  }

  private dependsOn(prerequisites: readonly number[], target: number, seen = new Set<number>()): boolean {
    return prerequisites.some((id) => {
      if (id === target) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return this.dependsOn(this.byId.get(id)?.prerequisites ?? [], target, seen);
    });
  }

  /** Tâches qui attendent celle-ci, directement ou non. */
  dependents(id: number): Task[] {
    const found = new Map<number, Task>();
    const visit = (target: number) => {
      for (const task of this.byId.values()) {
        if (task.prerequisites.includes(target) && !found.has(task.id)) {
          found.set(task.id, task);
          visit(task.id);
        }
      }
    };
    visit(id);
    return [...found.values()];
  }

  /** Échec en cascade : chaque tâche qui attend une préalable perdue échoue à son tour, avec le motif (E5b). */
  cascade(id: number, cause: string, at: Date): Task[] {
    const failed = this.dependents(id).filter((task) => NOT_STARTED.includes(task.state));
    for (const task of failed) task.fail(`Préalable T-${id} ${cause}`, at);
    return failed;
  }

  /** Relance d'une tâche : celles qui avaient échoué à cause d'elle redeviennent bloquées (E13b, annotation 5). */
  revive(id: number, at: Date): Task[] {
    const revived = this.dependents(id).filter(
      (task) => task.state === 'failed' && task.toSnapshot().failure?.startsWith('Préalable T-'),
    );
    for (const task of revived) task.relaunch(task.toSnapshot().guardrails, at, `avec T-${id}`);
    return revived;
  }

  /** Recalcule l'état de chaque tâche qui n'a pas démarré, d'après ses préalables. */
  settleAll(at: Date): Task[] {
    const changed: Task[] = [];
    for (const task of this.byId.values()) {
      if (!NOT_STARTED.includes(task.state)) continue;
      const before = task.state;
      const ready = task.prerequisites.every((id) => this.byId.get(id)?.state === 'validated');
      task.settle(ready, at);
      if (task.state !== before) changed.push(task);
    }
    return changed;
  }
}
