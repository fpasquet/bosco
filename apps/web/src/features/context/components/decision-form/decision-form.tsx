'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { DecisionTextDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { changedPart } from '../../lib/decisions';

/** Nouvelle décision (E9c), nouvelle version d'une décision acceptée (E9e), ou relecture avant d'accepter (E9b). */
export type DecisionFormMode = 'edit' | 'new' | 'review';

export interface DecisionFormValues {
  /** Accepter tout de suite, ou garder en proposition (nouvelle décision) */
  accept: boolean;
  note: string;
  text: DecisionTextDto;
}

export interface DecisionFormProps {
  busy: boolean;
  initial: DecisionTextDto | null;
  mode: DecisionFormMode;
  /** Numéro de la version créée par l'enregistrement (E9e) */
  nextVersion?: number;
  onCancel: () => void;
  onSubmit: (values: DecisionFormValues) => void;
  /** Erreur renvoyée par l'API pour la note */
  serverError: null | string;
  /** Projets entre lesquels choisir la cible d'une nouvelle décision ; sans eux, la cible est fixe */
  targetChoices?: string[];
  /** Projet visé (« site-perso ») */
  targetLabel: string;
  onTargetChange?: (project: string) => void;
}

/** La partie changée d'un champ, surlignée tant qu'elle n'est pas enregistrée, pour relire ce qui bouge. */
function ChangedPart({ after, before, id }: { after: string; before: string; id: string }) {
  const part = changedPart(before, after);
  if (!part) return null;
  return (
    <p id={id} className="text-xs text-muted">
      <span className="font-medium">Changé : </span>
      {part.prefix}
      {part.changed ? (
        <mark className="rounded-control bg-warning-soft text-ink">{part.changed}</mark>
      ) : (
        <span className="italic"> (texte retiré) </span>
      )}
      {part.suffix}
    </p>
  );
}

const required = (message: string) => z.string().refine((value) => value.trim().length > 0, message);

function schemaOf(mode: DecisionFormMode) {
  return z.object({
    title: required('Donne un titre à la décision.'),
    context: required('Écris le contexte : pourquoi la question se pose.'),
    decision: required('Écris ce qui est décidé.'),
    consequences: z.string(),
    alternatives: z.string(),
    note: mode === 'edit' ? required('Écris une note pour dire ce qui change.') : z.string(),
  });
}

type Values = z.infer<ReturnType<typeof schemaOf>>;

const FIELDS: { label: string; name: keyof Values; optional?: boolean; rows: number }[] = [
  { name: 'title', label: 'Titre', rows: 1 },
  { name: 'context', label: 'Contexte', rows: 3 },
  { name: 'decision', label: 'Décision', rows: 3 },
  { name: 'consequences', label: 'Conséquences', optional: true, rows: 2 },
  { name: 'alternatives', label: 'Alternatives écartées', optional: true, rows: 2 },
];

/** Formulaire d'une décision : titre, contexte et décision obligatoires, le reste facultatif (CA-CONT-12). */
export function DecisionForm({
  busy,
  initial,
  mode,
  nextVersion,
  onCancel,
  onSubmit,
  serverError,
  targetChoices,
  targetLabel,
  onTargetChange,
}: DecisionFormProps) {
  const { control, formState, handleSubmit, register, setError, setFocus } = useForm<Values>({
    resolver: zodResolver(schemaOf(mode)),
    defaultValues: {
      title: initial?.title ?? '',
      context: initial?.context ?? '',
      decision: initial?.decision ?? '',
      consequences: initial?.consequences ?? '',
      alternatives: initial?.alternatives ?? '',
      note: '',
    },
  });
  // L'API refuse la note : le champ passe en erreur et reçoit le focus (CA-CONT-21)
  useEffect(() => {
    if (!serverError) return;
    setError('note', { type: 'server', message: serverError });
    setFocus('note');
  }, [serverError, setError, setFocus]);
  const submit = (accept: boolean) =>
    handleSubmit((values) =>
      onSubmit({
        accept,
        note: values.note,
        text: {
          title: values.title,
          context: values.context,
          decision: values.decision,
          consequences: values.consequences || null,
          alternatives: values.alternatives || null,
        },
      }),
    );
  const errorOf = (name: keyof Values) => formState.errors[name]?.message;
  const values = useWatch({ control });
  // Modifier une décision acceptée : chaque champ changé montre sa partie changée par rapport à la version modifiée
  const changeOf = (name: keyof DecisionTextDto) =>
    mode === 'edit' && initial ? { after: values[name] ?? '', before: initial[name] ?? '' } : null;
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(event) => void submit(true)(event)}>
      {targetChoices && targetChoices.length > 0 ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Porte sur</span>
          <select
            className="select w-full"
            value={targetLabel}
            onChange={(event) => onTargetChange?.(event.target.value)}
          >
            {!targetChoices.includes(targetLabel) && <option value={targetLabel}>{targetLabel}</option>}
            {targetChoices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm text-muted">
          Porte sur <span className="font-medium text-ink">{targetLabel}</span>
        </p>
      )}
      {FIELDS.map(({ label, name, optional, rows }) => {
        const error = errorOf(name);
        const id = `decision-${name}`;
        const change = name === 'note' ? null : changeOf(name);
        const changed = change && change.after !== change.before ? `${id}-changed` : null;
        const described = [error && `${id}-error`, changed].filter(Boolean).join(' ') || undefined;
        return (
          <div key={name} className="flex flex-col gap-1.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">
                {label}
                {optional && <span className="text-muted"> (facultatif)</span>}
              </span>
              {rows === 1 ? (
                <input
                  className="input w-full"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={described}
                  {...register(name)}
                />
              ) : (
                <textarea
                  rows={rows}
                  className="textarea w-full"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={described}
                  {...register(name)}
                />
              )}
              {error && (
                <span id={`${id}-error`} className="text-xs text-danger">
                  {error}
                </span>
              )}
            </label>
            {change && changed && <ChangedPart id={changed} after={change.after} before={change.before} />}
          </div>
        );
      })}
      {mode === 'edit' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Note du changement (obligatoire)</span>
          <input
            className="input w-full"
            aria-invalid={errorOf('note') ? true : undefined}
            aria-describedby={errorOf('note') ? 'decision-note-error' : undefined}
            {...register('note')}
          />
          {errorOf('note') && (
            <span id="decision-note-error" className="text-xs text-danger">
              {errorOf('note')}
            </span>
          )}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        {mode === 'new' && (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void submit(false)()}>
            Garder en proposition
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {mode === 'new' && 'Accepter la décision'}
          {mode === 'review' && 'Accepter'}
          {mode === 'edit' && `Enregistrer la version ${nextVersion ?? ''}`.trim()}
        </Button>
      </div>
    </form>
  );
}
