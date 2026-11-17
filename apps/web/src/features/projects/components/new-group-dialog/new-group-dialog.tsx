'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';

const groupSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, 'Donne un nom au groupe.'),
  description: z.string(),
  projects: z.array(z.number()),
  search: z.string(),
});

type GroupValues = z.infer<typeof groupSchema>;

export interface NewGroupDialogProps {
  busy: boolean;
  /** Projets cochés à l'ouverture : celui dont on vient, depuis « Ajouter à un groupe » */
  initialProjects?: number[];
  onCancel: () => void;
  onSubmit: (group: { description: null | string; name: string; projects: number[] }) => void;
  open: boolean;
  /** Projets déjà ajoutés : seuls eux se cochent */
  projects: { id: number; name: string }[];
  /** Refus de l'API, posé sous le nom (« Un groupe porte déjà ce nom. ») */
  serverError: null | string;
}

/**
 * Nouveau groupe : un nom unique, une description facultative et les projets qu'il réunit, le premier coché étant le
 * projet principal. Il n'a pas d'instructions et s'affiche dans la barre latérale.
 */
export function NewGroupDialog({
  busy,
  initialProjects = [],
  onCancel,
  onSubmit,
  open,
  projects,
  serverError,
}: NewGroupDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { error: useId(), title: useId() };
  const { control, formState, handleSubmit, register, reset, setError, setValue } = useForm<GroupValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '', description: '', projects: initialProjects, search: '' },
  });
  const chosen = useWatch({ control, name: 'projects' });
  const search = useWatch({ control, name: 'search' }).trim().toLocaleLowerCase('fr');
  const initial = initialProjects.join(',');
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) {
      reset({ name: '', description: '', projects: initial ? initial.split(',').map(Number) : [], search: '' });
      element.showModal();
    }
    if (!open && element?.open) element.close();
  }, [initial, open, reset]);
  useEffect(() => {
    if (serverError) setError('name', { type: 'server', message: serverError });
  }, [serverError, setError]);
  // L'ordre des cases cochées est celui du groupe : la première est le projet principal
  const toggle = (id: number) =>
    setValue('projects', chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]);
  const shown = projects.filter(({ name }) => !search || name.toLocaleLowerCase('fr').includes(search));
  const error = formState.errors.name?.message;
  return (
    <dialog ref={dialog} className="modal" aria-labelledby={ids.title} onClose={onCancel}>
      <form
        noValidate
        className="modal-box flex max-w-lg flex-col gap-4"
        onSubmit={(event) =>
          void handleSubmit(({ description, name, projects: checked }) =>
            onSubmit({ name: name.trim(), description: description.trim() || null, projects: checked }),
          )(event)
        }
      >
        <div className="flex items-center">
          <h2 id={ids.title} className="font-display text-lg font-semibold">
            Nouveau groupe
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted"
            aria-label="Fermer"
            onClick={onCancel}
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Nom</span>
          <input
            className="input w-full"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? ids.error : undefined}
            {...register('name')}
          />
          {error && (
            <span id={ids.error} className="text-xs text-danger">
              {error}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">
            Description <span className="text-muted">(facultative)</span>
          </span>
          <input className="input w-full" {...register('description')} />
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium">Projets</legend>
          <input
            type="search"
            className="input w-full input-sm"
            aria-label="Chercher un projet"
            placeholder="Chercher un projet"
            {...register('search')}
          />
          <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto py-1">
            {shown.map(({ id, name }) => (
              <label key={id} className="flex items-center gap-2 font-mono text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={chosen.includes(id)}
                  onChange={() => toggle(id)}
                />
                {name}
              </label>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted">Aucun projet encore : ajoute d’abord des dossiers comme projets.</p>
            )}
          </div>
          <p className="text-xs text-muted">
            {chosen.length > 1 ? `${chosen.length} projets cochés` : `${chosen.length} projet coché`} · Le premier coché
            sera le projet principal ; tu le changes ensuite.
          </p>
        </fieldset>
        <p className="text-xs text-muted">Le groupe sera affiché dans la barre latérale.</p>
        <div className="modal-action mt-0">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            Créer le groupe
          </Button>
        </div>
      </form>
    </dialog>
  );
}
