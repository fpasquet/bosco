import { BehaviorSubject } from 'rxjs';
import type { ContainerEvents, ContainersView } from '../application/containers.service.ts';

/** Bus en mémoire des conteneurs en cours : le flux en direct relaie la dernière vue, puis chaque changement. */
export class ContainerEventsBus implements ContainerEvents {
  readonly views = new BehaviorSubject<ContainersView | null>(null);

  containersChanged(view: ContainersView): void {
    this.views.next(view);
  }
}
