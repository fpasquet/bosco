'use client';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TaskDraftDto, TaskDto, TaskIssueDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { usd } from '../../lib/tasks';

/** Plafonds des réglages généraux, tant que le dépôt n'a pas ses propres droits (E8a). */
export const DEFAULT_LIMITS = { budgetUsd: 2, maxTurns: 30, tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'] };

const TOOL_LABELS: Record<string, string> = {
  Bash: 'Bash',
  Edit: 'Modifier',
  Glob: 'Chercher des fichiers',
  Grep: 'Chercher',
  Read: 'Lire',
  Write: 'Écrire',
};

export interface TaskFormProps {
  busy: boolean;
  /** Tâche modifiée ; aucune : nouvelle tâche */
  editing?: TaskDto;
  issues: TaskIssueDto[];
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
export function TaskForm({ busy, editing, issues, onCancel, onSubmit, repositories, tasks }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraftDto>(() => ({
    repository: editing?.repository.name ?? repositories[0]?.name ?? '',
    folder: editing?.folder ?? '',
    instruction: editing?.instruction ?? '',
    mode: editing?.mode ?? 'worker',
    prerequisites: editing?.prerequisites ?? [],
    context: editing?.context ?? null,
    guardrails: editing?.guardrails ?? { budgetUsd: 1, maxTurns: DEFAULT_LIMITS.maxTurns, model: null, tools: null },
  }));
  const banner = useRef<HTMLDivElement>(null);
  // Le focus va au récapitulatif des erreurs, qui renvoie à chaque champ (CA-TACH-30)
  useEffect(() => {
    if (issues.length > 0) banner.current?.focus();
  }, [issues]);
  const set = (changes: Partial<TaskDraftDto>) => setDraft((current) => ({ ...current, ...changes }));
  const setGuardrails = (changes: Partial<TaskDraftDto['guardrails']>) =>
    setDraft((current) => ({ ...current, guardrails: { ...current.guardrails, ...changes } }));
  const candidates = tasks.filter((task) => task.id !== editing?.id && !draft.prerequisites.includes(task.id));
  const chosen = tasks.filter((task) => draft.prerequisites.includes(task.id));
  const sameRepository = chosen.filter((task) => task.repository.name === draft.repository);
  const startFrom = sameRepository.length === 1 ? sameRepository[0] : null;
  const tools = draft.guardrails.tools ?? DEFAULT_LIMITS.tools;
  const invalid = (field: TaskIssueDto['field']) => issues.some((issue) => issue.field === field);
  const describedBy = (field: TaskIssueDto['field']) => (invalid(field) ? `${FIELD_IDS[field]}-error` : undefined);
  return (
    <form
      className="grid gap-6 md:grid-cols-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
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
              onChange={(event) => set({ repository: event.target.value })}
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
            <input
              className="input w-full"
              placeholder="racine du dépôt"
              value={draft.folder}
              onChange={(event) => set({ folder: event.target.value })}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Consigne</span>
          <textarea
            id="task-instruction"
            className="textarea w-full"
            rows={4}
            value={draft.instruction}
            aria-invalid={invalid('instruction')}
            aria-describedby={describedBy('instruction')}
            onChange={(event) => set({ instruction: event.target.value })}
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
                  onChange={() => set({ mode: option.value })}
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
                  onClick={() => set({ prerequisites: draft.prerequisites.filter((id) => id !== task.id) })}
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
                event.target.value && set({ prerequisites: [...draft.prerequisites, Number(event.target.value)] })
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
            value={draft.context ?? ''}
            onChange={(event) => set({ context: event.target.value || null })}
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
                  value={draft.guardrails.budgetUsd}
                  aria-invalid={invalid('budgetUsd')}
                  aria-describedby={describedBy('budgetUsd') ?? 'task-budget-cap'}
                  onChange={(event) => setGuardrails({ budgetUsd: Number(event.target.value) })}
                />
                <span id="task-budget-cap" className="text-xs text-muted">
                  plafond du dépôt : {usd(DEFAULT_LIMITS.budgetUsd)}
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
                  value={draft.guardrails.maxTurns}
                  aria-invalid={invalid('maxTurns')}
                  aria-describedby={describedBy('maxTurns')}
                  onChange={(event) => setGuardrails({ maxTurns: Number(event.target.value) })}
                />
                <span className="text-xs text-muted">plafond du dépôt : {DEFAULT_LIMITS.maxTurns}</span>
                <FieldError field="maxTurns" issues={issues} />
              </label>
            </div>
            <fieldset id="task-tools" className="flex flex-col gap-1.5" aria-describedby={describedBy('tools')}>
              <legend className="text-xs font-medium">Outils</legend>
              <div className="flex flex-wrap gap-3">
                {DEFAULT_LIMITS.tools.map((tool) => (
                  <label key={tool} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={tools.includes(tool)}
                      onChange={(event) =>
                        setGuardrails({
                          tools: event.target.checked ? [...tools, tool] : tools.filter((t) => t !== tool),
                        })
                      }
                    />
                    {TOOL_LABELS[tool] ?? tool}
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
        {draft.mode === 'worker' && <p>Coût au plus {usd(draft.guardrails.budgetUsd)}</p>}
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
