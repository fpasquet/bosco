'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const rejectSchema = z.object({
  reason: z
    .string()
    .refine((value) => value.trim().length > 0, 'Écris le motif du rejet : il reste dans le journal de la tâche.'),
});

type RejectValues = z.infer<typeof rejectSchema>;

export interface RejectDialogProps {
  busy: boolean;
  /** Tâches qui l'attendent : elles échouent en cascade */
  followers: TaskDto[];
  onCancel: () => void;
  onReject: (values: RejectValues) => void;
  /** Ferme la fenêtre pour écrire à l'agent plutôt : il reprend sur la même branche (RF-TACH-10) */
  onWrite: () => void;
  open: boolean;
  task: TaskDto;
}

/** Rejet avec motif (E7b) : la tâche est abandonnée ; pour la faire reprendre, on écrit plutôt à l'agent. */
export function RejectDialog({ busy, followers, onCancel, onReject, onWrite, open, task }: RejectDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { formState, handleSubmit, register } = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    mode: 'onChange',
    defaultValues: { reason: '' },
  });
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const names = followers.map((follower) => `T-${follower.id}`).join(' et ');
  const verbs = followers.length > 1 ? 'attendent, échouent' : 'attend, échoue';
  const cascade = followers.length > 0 ? ` ; ${names}, qui l’${verbs} en cascade.` : '.';
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby="reject-title"
      onClose={onCancel}
    >
      <form
        noValidate
        className="modal-box flex flex-col gap-4"
        onSubmit={(event) => void handleSubmit(onReject)(event)}
      >
        <h2 id="reject-title" className="font-display text-lg font-semibold">
          Rejeter T-{task.id} ?
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Motif (obligatoire)</span>
          <textarea
            className="textarea w-full"
            rows={3}
            aria-invalid={formState.errors.reason ? true : undefined}
            {...register('reason')}
          />
        </label>
        {task.mode === 'worker' && (
          <div className="flex items-start gap-3 rounded-card border border-line px-4 py-3">
            <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">Tu veux qu’elle reprenne plutôt ?</span>
              <span className="block text-muted">
                Écris à l’agent : il reprend sur la même branche, dans la même conversation.
              </span>
            </p>
            <Button type="button" variant="link" size="sm" onClick={onWrite}>
              Écrire à l’agent
            </Button>
          </div>
        )}
        <p role="note" className="rounded-card bg-warning-soft px-4 py-3 text-sm text-warning">
          T-{task.id} passe « Rejetée »{cascade}
        </p>
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant="destructive" disabled={busy || !formState.isValid}>
            Rejeter T-{task.id}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
