import { Subject } from 'rxjs';
import type { TaskEvents } from '../application/ports.ts';
import type { TaskView } from '../application/task.service.ts';

/** Bus en mémoire des changements de tâches, que le flux en direct des tâches relaie (DT-06). */
export class TaskEventsBus implements TaskEvents {
  readonly changes = new Subject<TaskView>();

  tasksChanged(tasks: TaskView[]): void {
    for (const task of tasks) this.changes.next(task);
  }
}
