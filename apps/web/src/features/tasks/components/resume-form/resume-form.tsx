'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDto, TaskIssueDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { usd } from '../../lib/tasks';

/** Champ de la zone de message, que la fenêtre de rejet atteint par « Écrire à l'agent » (E7b). */
export const RESUME_MESSAGE_ID = 'task-message';

export interface ResumeValues {
  budgetUsd?: number;
  maxTurns?: number;
  message: string;
}

export interface ResumeFormProps {
  busy: boolean;
  /** Envoie le message ; les refus de l'API (plafonds du dépôt) reviennent champ par champ */
  onResume: (values: ResumeValues) => Promise<null | TaskIssueDto[]>;
  task: TaskDto;
}

/**
 * Zone de message d'une tâche à relire (RF-TACH-10) : le message relance l'agent dans la même conversation, sur la
 * même branche, dans le budget et les tours qui restent ; épuisés, ils se relèvent ici, sous les plafonds du dépôt.
 */
export function ResumeForm({ busy, onResume, task }: ResumeFormProps) {
  const left = {
    budget: task.guardrails.budgetUsd - task.spentUsd,
    turns: task.guardrails.maxTurns - task.outcome.turns,
  };
  const exhausted = left.budget <= 0 || left.turns <= 0;
  const schema = z.object({
    message: z.string().refine((value) => value.trim().length > 0, 'Écris ce que l’agent doit reprendre.'),
    budgetUsd: z
      .number({ error: 'Un budget en dollars.' })
      .gt(task.spentUsd, `Au-dessus de ce qui est déjà dépensé : ${usd(task.spentUsd)}.`),
    maxTurns: z
      .number({ error: 'Un nombre de tours.' })
      .int()
      .gt(task.outcome.turns, `Au-dessus des tours déjà faits : ${task.outcome.turns}.`),
  });
  const { formState, handleSubmit, register, reset, setError } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', budgetUsd: task.guardrails.budgetUsd, maxTurns: task.guardrails.maxTurns },
  });
  const send = handleSubmit(async ({ budgetUsd, maxTurns, message }) => {
    const issues = await onResume(
      exhausted ? { message: message.trim(), budgetUsd, maxTurns } : { message: message.trim() },
    );
    if (!issues) return reset();
    for (const issue of issues)
      if (issue.field === 'budgetUsd' || issue.field === 'maxTurns')
        setError(issue.field, { type: 'server', message: issue.message });
  });
  const { errors } = formState;
  const turns = `${left.turns} ${left.turns > 1 ? 'tours' : 'tour'}`;
  const room = exhausted ? 'une fois le budget ou les tours relevés' : `reste ${usd(left.budget)} et ${turns}`;
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
          <p className="text-warning">
            Budget ou tours épuisés : relève-les pour que l’agent reprenne, dans les limites du dépôt.
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Budget ($)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                className="input w-32"
                aria-invalid={errors.budgetUsd ? true : undefined}
                aria-describedby={errors.budgetUsd ? 'resume-budget-error' : undefined}
                {...register('budgetUsd', { valueAsNumber: true })}
              />
              {errors.budgetUsd && (
                <span id="resume-budget-error" className="text-xs text-danger">
                  {errors.budgetUsd.message}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Tours</span>
              <input
                type="number"
                min={1}
                step={1}
                className="input w-24"
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
