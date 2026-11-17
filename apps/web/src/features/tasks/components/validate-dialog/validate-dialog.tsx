'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto, TaskReviewDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const pullRequestSchema = z.object({
  title: z.string().refine((value) => value.trim().length > 0, 'Donne un titre à la PR.'),
  body: z.string(),
});

type PullRequestValues = z.infer<typeof pullRequestSchema>;

export interface ValidateDialogProps {
  busy: boolean;
  followers: TaskDto[];
  onCancel: () => void;
  /** null : valider sans pousser */
  onValidate: (pullRequest: null | PullRequestValues) => void;
  open: boolean;
  review: TaskReviewDto;
  task: TaskDto;
}

/**
 * Valider et ouvrir une PR brouillon (E7c), quand le dépôt est réglé sur « Demander à chaque fois » : Bosco montre ce
 * qu'il va pousser et la PR qu'il va ouvrir. Valider sans pousser reste possible.
 */
export function ValidateDialog({ busy, followers, onCancel, onValidate, open, review, task }: ValidateDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { formState, handleSubmit, register } = useForm<PullRequestValues>({
    resolver: zodResolver(pullRequestSchema),
    defaultValues: review.proposal,
  });
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby="validate-title"
      onClose={onCancel}
    >
      <form
        noValidate
        className="modal-box flex flex-col gap-4"
        onSubmit={(event) => void handleSubmit(onValidate)(event)}
      >
        <h2 id="validate-title" className="font-display text-lg font-semibold">
          Valider T-{task.id}
        </h2>
        {followers.length > 0 && (
          <p className="text-sm text-muted">
            {followers.map((follower) => `T-${follower.id}`).join(' et ')} pourra partir, sur la branche de T-{task.id}.
          </p>
        )}
        <div className="flex flex-col gap-1 rounded-control bg-surface-alt px-3 py-2 text-sm">
          <p className="font-medium">Pousser la branche et ouvrir une PR en brouillon ?</p>
          <p className="font-mono text-xs">
            {task.outcome.branch} → {task.outcome.from}
          </p>
          <p className="text-xs text-muted">
            {review.commits > 1 ? `${review.commits} commits` : `${review.commits} commit`} · vers origin · brouillon
          </p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Titre de la PR</span>
          <input
            className="input w-full"
            aria-invalid={formState.errors.title ? true : undefined}
            aria-describedby={formState.errors.title ? 'validate-title-error' : undefined}
            {...register('title')}
          />
          {formState.errors.title && (
            <span id="validate-title-error" className="text-xs text-danger">
              {formState.errors.title.message}
            </span>
          )}
        </label>
        <label className="hidden flex-col gap-1.5 sm:flex">
          <span className="text-xs font-medium">Description</span>
          <textarea className="textarea w-full" rows={5} {...register('body')} />
        </label>
        <p className="text-xs text-muted">Bosco pousse avec git et GitHub CLI de ce poste et ne fusionne jamais.</p>
        <div className="modal-action mt-0 flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onValidate(null)}>
            Valider sans pousser
          </Button>
          <Button type="submit" disabled={busy}>
            Valider et ouvrir la PR
          </Button>
        </div>
      </form>
    </dialog>
  );
}
