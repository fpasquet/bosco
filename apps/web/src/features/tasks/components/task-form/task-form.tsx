'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { type FieldErrors, type FieldPath, get, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { TaskDraftDto, TaskDto, TaskIssueDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { toolLabel } from '../../lib/rights';
import { usd } from '../../lib/tasks';

/** Plafonds d'un dépôt, d'après ses droits (E8a). */
export interface RepositoryLimits {
  budgetUsd: number;
  maxTurns: number;
  tools: string[];
}

/** Plafonds des réglages généraux d'origine, tant que les droits du dépôt ne sont pas lus. */
export const DEFAULT_LIMITS: RepositoryLimits = {
  budgetUsd: 2,
  maxTurns: 30,
  tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
};

export interface TaskFormProps {
  busy: boolean;
  /** Tâche modifiée ; aucune : nouvelle tâche */
  editing?: TaskDto;
  issues: TaskIssueDto[];
  /** Plafonds de chaque dépôt, par nom */
  limits?: Record<string, RepositoryLimits>;
  onCancel: () => void;
  onSubmit: (draft: TaskDraftDto) => void;
  repositories: { name: string; root: string }[];
  /** Tâches qu'une nouvelle tâche peut attendre */
  tasks: TaskDto[];
}

/** « Partira quand T-12 sera validée » */
function startsWhen(chosen: readonly TaskDto[]): string {
  if (chosen.length === 0) return 'Partira dès sa création';
  const ids = chosen.map((task) => 'T-' + task.id).join(' et ');
  return `Partira quand ${ids} ${chosen.length > 1 ? 'seront validées' : 'sera validée'}`;
}

/** Ce que le formulaire vérifie seul, avec les messages de l'API ; les plafonds du dépôt restent vérifiés par l'API. */
const draftSchema = z.object({
  repository: z.string().min(1, 'Choisis un dépôt des sources surveillées.'),
  folder: z.string(),
  instruction: z.string().refine((value) => value.trim().length > 0, 'Écris la consigne de la tâche.'),
  mode: z.enum(['session', 'worker']),
  prerequisites: z.array(z.number()),
  context: z.string().nullable(),
  guardrails: z.object({
    budgetUsd: z.number({ error: 'Un budget en dollars.' }).positive('Un budget au-dessus de 0 $.'),
    maxTurns: z.number({ error: 'Un nombre de tours.' }).int('Un nombre de tours entier.').positive('Au moins 1 tour.'),
    model: z.string().nullable(),
    tools: z.array(z.string()).nullable(),
  }),
}) satisfies z.ZodType<TaskDraftDto>;

/** Champ du formulaire de chaque erreur, dans l'ordre du récapitulatif. */
const PATHS: Record<TaskIssueDto['field'], FieldPath<TaskDraftDto>> = {
  repository: 'repository',
  instruction: 'instruction',
  prerequisites: 'prerequisites',
  budgetUsd: 'guardrails.budgetUsd',
  maxTurns: 'guardrails.maxTurns',
  tools: 'guardrails.tools',
};

/** Erreurs du formulaire et de l'API, une par champ. */
function issuesOf(errors: FieldErrors<TaskDraftDto>): TaskIssueDto[] {
  return (Object.entries(PATHS) as [TaskIssueDto['field'], FieldPath<TaskDraftDto>][]).flatMap(([field, path]) => {
    const error: undefined | { message?: string } = get(errors, path);
    return error?.message ? [{ field, message: error.message }] : [];
  });
}

const FIELD_IDS: Record<TaskIssueDto['field'], string> = {
  budgetUsd: 'task-budget',
  instruction: 'task-instruction',
  maxTurns: 'task-turns',
  prerequisites: 'task-prerequisites',
  repository: 'task-repository',
  tools: 'task-tools',
};

function FieldError({ field, issues }: { field: TaskIssueDto['field']; issues: TaskIssueDto[] }) {
  const issue = issues.find((candidate) => candidate.field === field);
  if (!issue) return null;
  return (
    <p id={`${FIELD_IDS[field]}-error`} className="text-xs text-danger">
      {issue.message}
    </p>
  );
}

/** Formulaire d'une tâche (E6a) : où, quoi, comment, après quoi, et dans quelles limites ; erreurs liées (E6b). */
export function TaskForm({
  busy,
  editing,
  issues: serverIssues,
  limits: limitsOf,
  onCancel,
  onSubmit,
  repositories,
  tasks,
}: TaskFormProps) {
  const { control, formState, handleSubmit, register, setError, setValue } = useForm<TaskDraftDto>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      repository: editing?.repository.name ?? repositories[0]?.name ?? '',
      folder: editing?.folder ?? '',
      instruction: editing?.instruction ?? '',
      mode: editing?.mode ?? 'worker',
      prerequisites: editing?.prerequisites ?? [],
      context: editing?.context ?? null,
      guardrails: editing?.guardrails ?? { budgetUsd: 1, maxTurns: DEFAULT_LIMITS.maxTurns, model: null, tools: null },
    },
  });
  // Valeurs complètes : chaque champ a sa valeur par défaut
  const draft = useWatch({ control }) as TaskDraftDto;
  // Les erreurs renvoyées par l'API se posent sur leur champ, comme celles du formulaire
  useEffect(() => {
    for (const issue of serverIssues) setError(PATHS[issue.field], { type: 'server', message: issue.message });
  }, [serverIssues, setError]);
  const issues = issuesOf(formState.errors);
  const banner = useRef<HTMLDivElement>(null);
  // Le focus va au récapitulatif des erreurs, qui renvoie à chaque champ (CA-TACH-30)
  const hasIssues = issues.length > 0;
  useEffect(() => {
    if (hasIssues) banner.current?.focus();
  }, [hasIssues, serverIssues, formState.submitCount]);
  const dirty = { shouldDirty: true } as const;
  const candidates = tasks.filter((task) => task.id !== editing?.id && !draft.prerequisites.includes(task.id));
  const chosen = tasks.filter((task) => draft.prerequisites.includes(task.id));
  const sameRepository = chosen.filter((task) => task.repository.name === draft.repository);
  const startFrom = sameRepository.length === 1 ? sameRepository[0] : null;
  const limits = limitsOf?.[draft.repository] ?? DEFAULT_LIMITS;
  const tools = draft.guardrails.tools ?? limits.tools;
  const invalid = (field: TaskIssueDto['field']) => issues.some((issue) => issue.field === field);
  const describedBy = (field: TaskIssueDto['field']) => (invalid(field) ? `${FIELD_IDS[field]}-error` : undefined);
  return (
    <form
      className="grid gap-6 md:grid-cols-3"
      noValidate
      onSubmit={(event) => void handleSubmit((values) => onSubmit(values))(event)}
    >
      <div className="flex flex-col gap-5 md:col-span-2">
        {issues.length > 0 && (
          <div
            ref={banner}
            tabIndex={-1}
            role="alert"
            className="rounded-card border border-danger bg-danger-soft px-4 py-3 text-danger"
          >
            <p className="font-semibold">
              {issues.length > 1 ? `${issues.length} points à corriger` : '1 point à corriger'}
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {issues.map((issue) => (
                <li key={issue.field}>
                  <a href={`#${FIELD_IDS[issue.field]}`} className="link">
                    {issue.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Dépôt</span>
            <select
              id="task-repository"
              className="select w-full"
              disabled={Boolean(editing)}
              value={draft.repository}
              aria-invalid={invalid('repository')}
              aria-describedby={describedBy('repository')}
              onChange={(event) => setValue('repository', event.target.value, dirty)}
            >
              {repositories.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <FieldError field="repository" issues={issues} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Dossier</span>
            <input className="input w-full" placeholder="racine du dépôt" {...register('folder')} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Consigne</span>
          <textarea
            id="task-instruction"
            className="textarea w-full"
            rows={4}
            aria-invalid={invalid('instruction')}
            aria-describedby={describedBy('instruction')}
            {...register('instruction')}
          />
          <FieldError field="instruction" issues={issues} />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-xs font-medium">Mode</legend>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { value: 'worker' as const, label: 'Worker', hint: 'Sans terminal, dans une copie jetable du dépôt.' },
              { value: 'session' as const, label: 'Ma session', hint: 'Attend qu’une session Claude Code la prenne.' },
            ].map((option) => (
              <label
                key={option.value}
                aria-label={option.label}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-card border p-3',
                  draft.mode === option.value ? 'border-primary bg-primary-soft' : 'border-line bg-surface',
                )}
              >
                <input
                  type="radio"
                  name="mode"
                  className="radio mt-0.5 radio-sm"
                  checked={draft.mode === option.value}
                  onChange={() => setValue('mode', option.value, dirty)}
                />
                <span>
                  <span className="block font-medium">{option.label}</span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div id="task-prerequisites" className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Tâches préalables</span>
          <div className="flex flex-wrap items-center gap-2">
            {chosen.map((task) => (
              <span key={task.id} className="badge gap-1 badge-outline">
                T-{task.id} · {task.title}
                <button
                  type="button"
                  aria-label={`Retirer T-${task.id}`}
                  onClick={() =>
                    setValue(
                      'prerequisites',
                      draft.prerequisites.filter((id) => id !== task.id),
                      dirty,
                    )
                  }
                >
                  <X aria-hidden className="size-3" />
                </button>
              </span>
            ))}
            <select
              aria-label="Ajouter une tâche préalable"
              className="select w-auto select-sm"
              value=""
              aria-invalid={invalid('prerequisites')}
              aria-describedby={describedBy('prerequisites')}
              onChange={(event) =>
                event.target.value &&
                setValue('prerequisites', [...draft.prerequisites, Number(event.target.value)], dirty)
              }
            >
              <option value="">Ajouter une tâche préalable</option>
              {candidates.map((task) => (
                <option key={task.id} value={task.id}>
                  T-{task.id} · {task.title}
                </option>
              ))}
            </select>
          </div>
          {startFrom && (
            <p className="text-xs text-muted">
              Même dépôt : la tâche partira de la branche de T-{startFrom.id} tant qu’elle n’est pas fusionnée.
            </p>
          )}
          <FieldError field="prerequisites" issues={issues} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Contexte (facultatif)</span>
          <input
            className="input w-full"
            placeholder="Ticket, PR ou décision"
            {...register('context', { setValueAs: (value: null | string) => value || null })}
          />
        </label>
        {draft.mode === 'worker' ? (
          <fieldset className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
            <legend className="px-1 text-xs font-medium">
              Garde-fous plafonnés par les droits de {draft.repository}
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">Budget ($)</span>
                <input
                  id="task-budget"
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="input w-full"
                  aria-invalid={invalid('budgetUsd')}
                  aria-describedby={describedBy('budgetUsd') ?? 'task-budget-cap'}
                  {...register('guardrails.budgetUsd', { valueAsNumber: true })}
                />
                <span id="task-budget-cap" className="text-xs text-muted">
                  plafond du dépôt : {usd(limits.budgetUsd)}
                </span>
                <FieldError field="budgetUsd" issues={issues} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">Tours</span>
                <input
                  id="task-turns"
                  type="number"
                  min={1}
                  className="input w-full"
                  aria-invalid={invalid('maxTurns')}
                  aria-describedby={describedBy('maxTurns')}
                  {...register('guardrails.maxTurns', { valueAsNumber: true })}
                />
                <span className="text-xs text-muted">plafond du dépôt : {limits.maxTurns}</span>
                <FieldError field="maxTurns" issues={issues} />
              </label>
            </div>
            <fieldset id="task-tools" className="flex flex-col gap-1.5" aria-describedby={describedBy('tools')}>
              <legend className="text-xs font-medium">Outils</legend>
              <div className="flex flex-wrap gap-3">
                {limits.tools.map((tool) => (
                  <label key={tool} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={tools.includes(tool)}
                      onChange={(event) =>
                        setValue(
                          'guardrails.tools',
                          event.target.checked ? [...tools, tool] : tools.filter((t) => t !== tool),
                          dirty,
                        )
                      }
                    />
                    {toolLabel(tool)}
                  </label>
                ))}
              </div>
              <FieldError field="tools" issues={issues} />
            </fieldset>
          </fieldset>
        ) : (
          <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-sm text-muted">
            Les réglages de ta session s’appliquent : les garde-fous ne valent que pour le worker.
          </p>
        )}
      </div>
      <aside className="flex flex-col gap-3 self-start rounded-card border border-line bg-surface p-4 shadow-card">
        <h2 className="text-xs font-semibold text-muted">Récapitulatif</h2>
        <p>{startsWhen(chosen)}</p>
        {draft.mode === 'worker' && <p>Coût au plus {usd(draft.guardrails.budgetUsd || 0)}</p>}
        <p className="text-muted">
          {startFrom ? `Sur la branche de T-${startFrom.id}` : 'Sur la branche principale du dépôt'}
        </p>
        <p className="text-xs text-muted">Départ dès que les préalables sont validées.</p>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            {editing ? 'Enregistrer' : 'Créer la tâche'}
          </Button>
        </div>
      </aside>
    </form>
  );
}
