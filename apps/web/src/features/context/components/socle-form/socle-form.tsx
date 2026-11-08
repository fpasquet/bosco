'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { SocleDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';

const socleSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, 'Donne un nom au socle.'),
  scope: z.enum(['global', 'shared']),
  inherits: z.string(),
  repositories: z.array(z.string()),
});

type SocleValues = z.infer<typeof socleSchema>;

export interface SocleFormProps {
  busy: boolean;
  /** Socle modifié (E14a, « Modifier le socle ») ; rien pour un nouveau socle (E14b) */
  initial?: null | SocleDto;
  onCancel: () => void;
  onSubmit: (socle: {
    inherits: null | number;
    name: string;
    repositories: string[];
    scope: 'global' | 'shared';
  }) => void;
  repositories: string[];
  /** Erreur renvoyée par l'API pour l'héritage (une boucle) */
  serverError: null | string;
  socles: SocleDto[];
}

/**
 * Nouveau socle (E14b) : un nom, une portée, un socle dont il hérite, et ses dépôts s'il est partagé. Le même
 * formulaire modifie un socle existant, prérempli.
 */
export function SocleForm({
  busy,
  initial = null,
  onCancel,
  onSubmit,
  repositories,
  serverError,
  socles,
}: SocleFormProps) {
  const { control, formState, handleSubmit, register, setError } = useForm<SocleValues>({
    resolver: zodResolver(socleSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          scope: initial.scope,
          inherits: initial.inherits === null ? '' : String(initial.inherits),
          repositories: initial.repositories,
        }
      : { name: '', scope: 'shared', inherits: '', repositories: [] },
  });
  // Un socle n'hérite pas de lui-même ; une boucle plus longue est refusée par Bosco (CA-CONT-62)
  const parents = socles.filter(({ id }) => id !== initial?.id);
  const scope = useWatch({ control, name: 'scope' });
  const chosen = useWatch({ control, name: 'repositories' });
  useEffect(() => {
    if (serverError) setError('inherits', { type: 'server', message: serverError });
  }, [serverError, setError]);
  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={(event) =>
        void handleSubmit((values) =>
          onSubmit({
            name: values.name,
            scope: values.scope,
            inherits: values.inherits ? Number(values.inherits) : null,
            repositories: values.repositories,
          }),
        )(event)
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Nom</span>
        <input
          className="input w-full"
          aria-invalid={formState.errors.name ? true : undefined}
          aria-describedby={formState.errors.name ? 'socle-name-error' : undefined}
          {...register('name')}
        />
        {formState.errors.name && (
          <span id="socle-name-error" className="text-xs text-danger">
            {formState.errors.name.message}
          </span>
        )}
      </label>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-xs font-medium">Portée</legend>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" value="global" {...register('scope')} />
          Global : tous les dépôts
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" className="radio radio-sm" value="shared" {...register('scope')} />
          Partagé : les seuls dépôts cochés
        </label>
      </fieldset>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">
          Hérite de <span className="text-muted">(facultatif)</span>
        </span>
        <select
          className="select w-full"
          aria-invalid={formState.errors.inherits ? true : undefined}
          aria-describedby={formState.errors.inherits ? 'socle-inherits-error' : undefined}
          {...register('inherits')}
        >
          <option value="">Aucun socle</option>
          {parents.map((socle) => (
            <option key={socle.id} value={socle.id}>
              {socle.name}
            </option>
          ))}
        </select>
        {formState.errors.inherits && (
          <span id="socle-inherits-error" className="text-xs text-danger">
            {formState.errors.inherits.message}
          </span>
        )}
      </label>
      {scope === 'shared' && (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium">Dépôts</legend>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {repositories.map((name) => (
              <label key={name} className="flex items-center gap-2 font-mono text-sm">
                <input type="checkbox" className="checkbox checkbox-sm" value={name} {...register('repositories')} />
                {name}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">
            {chosen.length > 1 ? `${chosen.length} dépôts sélectionnés` : `${chosen.length} dépôt sélectionné`}
          </p>
        </fieldset>
      )}
      {!initial && (
        <p className="text-xs text-muted">
          Un socle sans décision n’a aucun effet : ajoute-en ensuite depuis la liste des socles.
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={busy}>
          {initial ? 'Enregistrer' : 'Créer le socle'}
        </Button>
      </div>
    </form>
  );
}
