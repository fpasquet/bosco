'use client';
import { Eye } from 'lucide-react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import type { GroupDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { arrivalOrder, keyedLines, projectsLabel } from '../../lib/groups';

export interface GroupInstructionsProps {
  busy: boolean;
  group: GroupDto;
  /** Tous les groupes, pour dire dans quel ordre le texte arrive aux agents */
  groups: GroupDto[];
  onPreview: () => void;
  /** Texte à enregistrer, après la confirmation qui compte les projets touchés */
  onSave: (instructions: string) => void;
}

/**
 * Instructions d'un groupe : un texte libre, une consigne par ligne, transmis aux agents de chacun de ses projets
 * après celles de « Tous les projets ». Elles se rédigent depuis le poste ; le téléphone les lit.
 */
export function GroupInstructions({ busy, group, groups, onPreview, onSave }: GroupInstructionsProps) {
  const ids = { order: useId(), text: useId() };
  const { formState, handleSubmit, register, reset } = useForm({
    defaultValues: { instructions: group.instructions },
  });
  const principal = group.projects[0]?.name ?? null;
  const lines = keyedLines(group.instructions);
  const order = arrivalOrder(group, groups);
  const audience = group.system ? 'tous les projets' : `ses ${projectsLabel(group.projects.length)}`;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <section
        aria-labelledby={ids.text}
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card md:col-span-2"
      >
        <h2 id={ids.text} className="text-xs font-semibold text-muted">
          Instructions transmises aux agents de {audience}
        </h2>
        <form
          className="hidden flex-col gap-3 md:flex"
          onSubmit={(event) => void handleSubmit(({ instructions }) => onSave(instructions))(event)}
        >
          <textarea
            rows={8}
            className="textarea w-full font-mono text-sm"
            aria-label={`Instructions de ${group.name}`}
            {...register('instructions')}
          />
          <p className="text-xs text-muted">
            Texte libre, une consigne par ligne. Une décision acceptée d’un projet l’emporte.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!formState.isDirty}
              onClick={() => reset({ instructions: group.instructions })}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={busy || !formState.isDirty}>
              Enregistrer
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-2 md:hidden">
          {lines.length === 0 ? (
            <p className="text-muted">Aucune instruction.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {lines.map(({ key, line }) => (
                <li key={key}>{line}</li>
              ))}
            </ul>
          )}
          <p className="rounded-card border border-line bg-surface-alt px-3 py-2 text-xs text-muted">
            Modifiable depuis le poste. Les instructions se rédigent depuis le poste seulement.
          </p>
        </div>
      </section>
      <section
        aria-labelledby={ids.order}
        className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
      >
        <div>
          <h2 id={ids.order} className="text-xs font-semibold text-muted">
            Où ces instructions arrivent
          </h2>
          {principal && <p className="text-xs text-muted">Ordre du texte transmis à un agent de {principal}</p>}
        </div>
        <ol aria-label="Ordre du texte transmis" className="flex flex-col gap-1.5 text-sm">
          {order.map(({ current, lines: count, name }, index) => (
            <li key={name} className="flex items-center gap-2">
              <span className="badge badge-ghost font-mono badge-sm">{index + 1}</span>
              <span className={current ? 'font-medium' : undefined}>{name}</span>
              {current && <span className="badge badge-outline badge-sm">ce groupe</span>}
              <span className="ml-auto text-xs text-muted">{count > 1 ? `${count} lignes` : `${count} ligne`}</span>
            </li>
          ))}
          {principal && (
            <li className="flex items-center gap-2">
              <span className="badge badge-ghost font-mono badge-sm">{order.length + 1}</span>
              Décisions de {principal}
              <span className="ml-auto text-xs text-muted">l’emportent</span>
            </li>
          )}
        </ol>
        <Button variant="outline" size="sm" disabled={!principal} onClick={onPreview}>
          <Eye aria-hidden className="size-4" />
          Aperçu du texte transmis
        </Button>
      </section>
    </div>
  );
}
