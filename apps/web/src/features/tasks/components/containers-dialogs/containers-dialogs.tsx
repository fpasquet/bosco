'use client';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useEffect, useRef } from 'react';
import type { RunningAgentDto, RunningServiceDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { serviceLogs } from '../../api/containers';
import { cancellationQuery } from '../../api/tasks';

/** Fenêtre de daisyUI ouverte par showModal : Échap et le fond la ferment ; en bas de l'écran sur téléphone. */
function Modal({ children, label, onClose }: { children: ReactNode; label: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  return (
    <dialog ref={dialog} aria-labelledby={label} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box flex flex-col gap-4">{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}

/** Redémarrer un service de test (E19b) : ce que la tâche perd, et pendant combien de temps. */
export function RestartDialog({
  agent,
  onClose,
  onRestart,
  service,
}: {
  agent: Pick<RunningAgentDto, 'taskId'>;
  onClose: () => void;
  onRestart: () => void;
  service: Pick<RunningServiceDto, 'image' | 'service'>;
}) {
  return (
    <Modal label="restart-title" onClose={onClose}>
      <h2 id="restart-title" className="font-display text-lg font-semibold">
        Redémarrer {service.service} ?
      </h2>
      <p className="rounded-control border border-warning bg-warning-soft px-4 py-3 text-sm">
        T-{agent.taskId} perd {service.service} pendant quelques secondes. Si l’agent lance ses tests à ce moment, ils
        échouent, et il le voit dans leur sortie.
      </p>
      <p className="text-sm text-muted">
        Le service redémarre sans être recréé : ses données de test restent. Il est prêt quand sa vérification d’état
        répond, 180 s au plus ; le journal de la tâche le note.
      </p>
      <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
        <Button variant="ghost" onClick={onClose}>
          Garder le service
        </Button>
        <Button variant="primary" onClick={onRestart}>
          Redémarrer {service.service}
        </Button>
      </div>
    </Modal>
  );
}

/** « Arrêter » un agent : annule sa tâche, avec la même confirmation que son détail (E13c, CA-CONT-74). */
export function StopAgentDialog({
  agent,
  busy,
  onClose,
  onStop,
}: {
  agent: Pick<RunningAgentDto, 'taskId' | 'title'>;
  busy: boolean;
  onClose: () => void;
  onStop: () => void;
}) {
  const { data: failing } = useQuery(cancellationQuery(agent.taskId));
  return (
    <Modal label="stop-title" onClose={onClose}>
      <h2 id="stop-title" className="font-display text-lg font-semibold">
        Arrêter T-{agent.taskId} ?
      </h2>
      <p className="text-sm">
        L’agent s’arrête en quelques secondes et la tâche « {agent.title} » est annulée ; sa branche reste.
      </p>
      {failing && failing.length > 0 && (
        <section className="rounded-control border border-danger bg-danger-soft px-4 py-3 text-sm">
          <h3 className="font-semibold text-danger">
            Annuler cette tâche fera échouer {failing.length > 1 ? `${failing.length} tâches` : '1 tâche'}
          </h3>
          <ul className="mt-1 list-disc pl-5">
            {failing.map((task) => (
              <li key={task.id}>
                T-{task.id} · {task.title}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
        <Button variant="ghost" onClick={onClose}>
          Garder la tâche
        </Button>
        <Button variant="destructive" disabled={busy} onClick={onStop}>
          Arrêter et annuler la tâche
        </Button>
      </div>
    </Modal>
  );
}

/** « Journal » d'un service de test : ses 300 dernières lignes (E19a). */
export function LogsDialog({ onClose, service }: { onClose: () => void; service: RunningServiceDto }) {
  const { data, isError } = useQuery({
    queryKey: ['service-logs', service.name],
    queryFn: () => serviceLogs(service.name),
  });
  return (
    <Modal label="logs-title" onClose={onClose}>
      <h2 id="logs-title" className="font-display text-lg font-semibold">
        Journal de {service.service}
      </h2>
      <p className="text-xs text-muted">Les 300 dernières lignes, au moment de l’ouverture.</p>
      <pre className="max-h-96 overflow-auto rounded-control bg-surface-alt p-3 font-mono text-xs whitespace-pre-wrap">
        {isError ? 'Le journal n’a pas pu être lu.' : (data ?? 'Lecture…') || 'Journal vide.'}
      </pre>
      <div className="modal-action mt-0">
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}
