'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const rejectSchema = z.object({
  reason: z.string().refine((value) => value.trim().length > 0, 'Écris le motif du rejet : il est transmis à l’agent.'),
  relaunch: z.boolean(),
});

type RejectValues = z.infer<typeof rejectSchema>;

export interface RejectDialogProps {
  busy: boolean;
  /** Tâches qui l'attendent : elles échouent en cascade sans relance */
  followers: TaskDto[];
  onCancel: () => void;
  onReject: (values: RejectValues) => void;
  open: boolean;
  task: TaskDto;
}

/** Rejet avec motif (E7b) : par défaut, la tâche repart avec ce motif ; décochée, elle est rejetée pour de bon. */
export function RejectDialog({ busy, followers, onCancel, onReject, open, task }: RejectDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { control, formState, handleSubmit, register } = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    mode: 'onChange',
    defaultValues: { reason: '', relaunch: true },
  });
  const relaunch = useWatch({ control, name: 'relaunch' });
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  const names = followers.map((follower) => `T-${follower.id}`).join(' et ');
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
        <label className="flex items-start gap-3">
          <input type="checkbox" className="checkbox mt-0.5 checkbox-sm" {...register('relaunch')} />
          <span>
            <span className="block">Relancer la tâche avec ce motif comme consigne complémentaire</span>
            <span className="block text-xs text-muted">
              Elle repart sur la même branche{names ? ` ; ${names} continuent d’attendre` : ''}.
            </span>
          </span>
        </label>
        {followers.length > 0 && (
          <p role="note" className="rounded-card bg-warning-soft px-4 py-3 text-sm text-warning">
            Sans relance, T-{task.id} passe « Rejetée » et {names} {followers.length > 1 ? 'échouent' : 'échoue'} en
            cascade.
          </p>
        )}
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" variant={relaunch ? 'primary' : 'destructive'} disabled={busy || !formState.isValid}>
            {relaunch ? 'Rejeter et relancer' : 'Rejeter'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
