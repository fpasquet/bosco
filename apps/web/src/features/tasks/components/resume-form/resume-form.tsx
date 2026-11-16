'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto, TaskIssueDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

/** Champ de la zone de message, que la fenêtre de rejet atteint par « Écrire à l'agent » (E7b). */
export const RESUME_MESSAGE_ID = 'task-message';

export interface ResumeValues {
  maxTurns?: number;
  message: string;
}

export interface ResumeFormProps {
  busy: boolean;
  /** Envoie le message ; un plafond de tours refusé par l'API (plafond du dépôt) revient sous son champ */
  onResume: (values: ResumeValues) => Promise<null | TaskIssueDto[]>;
  task: TaskDto;
}

/**
 * Zone de message d'une tâche à relire (RF-TACH-10) : le message relance l'agent dans la même conversation, sur la
 * même branche, dans les tours qui restent ; atteint, le plafond de tours se relève ici, sous celui du dépôt
 * (CA-TACH-98). Le quota de l'abonnement peut faire attendre la reprise (DT-39).
 */
export function ResumeForm({ busy, onResume, task }: ResumeFormProps) {
  const left = task.guardrails.maxTurns - task.outcome.turns;
  const exhausted = left <= 0;
  const schema = z.object({
    message: z.string().refine((value) => value.trim().length > 0, 'Écris ce que l’agent doit reprendre.'),
    maxTurns: z
      .number({ error: 'Un nombre de tours.' })
      .int()
      .gt(task.outcome.turns, `Au-dessus des tours déjà faits : ${task.outcome.turns}.`),
  });
  const { formState, handleSubmit, register, reset, setError } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', maxTurns: task.guardrails.maxTurns },
  });
  const send = handleSubmit(async ({ maxTurns, message }) => {
    const issues = await onResume(exhausted ? { message: message.trim(), maxTurns } : { message: message.trim() });
    if (!issues) return reset();
    for (const issue of issues)
      if (issue.field === 'maxTurns') setError('maxTurns', { type: 'server', message: issue.message });
  });
  const { errors } = formState;
  const turns = left > 1 ? 'tours' : 'tour';
  const room = exhausted ? 'une fois le plafond de tours relevé' : `reste ${left} ${turns}`;
  const hint = `Relance un tour sur ${task.outcome.branch ?? 'sa branche'}, dans la même conversation · ${room}`;
  return (
    <form
      noValidate
      aria-label="Écrire à l’agent"
      className="flex flex-col gap-2 border-t border-line p-3"
      onSubmit={(event) => void send(event)}
    >
      {exhausted && (
        <div className="flex flex-col gap-2 rounded-card bg-warning-soft px-3 py-2.5 text-sm">
          <p className="text-warning">Plafond de tours atteint : relève-le pour que l’agent reprenne.</p>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium">Tours au plus</span>
            <input
              type="number"
              min={1}
              step={1}
              className="input w-28"
              aria-invalid={errors.maxTurns ? true : undefined}
              aria-describedby={errors.maxTurns ? 'resume-turns-error' : undefined}
              {...register('maxTurns', { valueAsNumber: true })}
            />
            {errors.maxTurns && (
              <span id="resume-turns-error" className="text-xs text-danger">
                {errors.maxTurns.message}
              </span>
            )}
          </label>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-card border border-line bg-surface p-2 shadow-card">
        <label htmlFor={RESUME_MESSAGE_ID} className="sr-only">
          Message à l’agent
        </label>
        <textarea
          id={RESUME_MESSAGE_ID}
          rows={2}
          placeholder="Demande une correction à l’agent…"
          className="textarea min-w-0 flex-1 resize-none border-0 bg-transparent shadow-none"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby="resume-hint"
          {...register('message')}
        />
        <Button type="submit" size="icon-sm" className="rounded-full" aria-label="Envoyer" disabled={busy}>
          <ArrowUp aria-hidden className="size-4" />
        </Button>
      </div>
      <p id="resume-hint" className="px-1 text-xs text-muted">
        {errors.message?.message ?? hint}
      </p>
    </form>
  );
}
