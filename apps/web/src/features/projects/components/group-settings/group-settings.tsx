'use client';
import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FolderSearch, Star } from 'lucide-react';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { APP_NAME, type GroupDto } from '@bosco/domain';

type Member = GroupDto['projects'][number];

export interface GroupSettingsProps {
  busy: boolean;
  group: GroupDto;
  onArrange: (projects: Member[]) => void;
  onBrowse: () => void;
  onDelete: () => void;
  onProfile: (profile: null | string) => void;
  onRename: (identity: { description: null | string; name: string }) => void;
  onSidebar: (shown: boolean) => void;
  /** Profils Claude Code surveillés, que le groupe peut prendre par défaut */
  profiles: { label: string; path: string }[];
  /** Projets ajoutés : ceux qui ne sont pas encore dans le groupe se proposent */
  projects: Member[];
  /** Refus de l'API pour le nom (« Un groupe porte déjà ce nom. ») */
  serverError: null | string;
}

const identitySchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, 'Donne un nom au groupe.'),
  description: z.string(),
});

/** D'où vient le profil des sessions démarrées avec le groupe. */
function profileOrigin(chosen: null | string, watched: boolean): string {
  if (chosen === null) return `Hérité · profil du projet principal, à défaut celui de ${APP_NAME}`;
  return watched ? 'Réglé ici' : 'Réglé ici · profil qui n’est plus surveillé';
}

function Card({ children, title }: { children: ReactNode; title: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface shadow-card">
      <h2 id={id} className="border-b border-line px-4 py-2.5 text-xs font-semibold text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-3 px-4 py-3">{children}</div>
    </section>
  );
}

function Identity({
  busy,
  group,
  onRename,
  serverError,
}: Pick<GroupSettingsProps, 'busy' | 'group' | 'onRename' | 'serverError'>) {
  const errorId = useId();
  const { formState, handleSubmit, register, setError } = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: { name: group.name, description: group.description ?? '' },
  });
  useEffect(() => {
    if (serverError) setError('name', { type: 'server', message: serverError });
  }, [serverError, setError]);
  const error = formState.errors.name?.message;
  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) =>
        void handleSubmit(({ description, name }) =>
          onRename({ name: name.trim(), description: description.trim() || null }),
        )(event)
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Nom</span>
        <input
          className="input w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...register('name')}
        />
        {error && (
          <span id={errorId} className="text-xs text-danger">
            {error}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Description</span>
        <input className="input w-full" {...register('description')} />
      </label>
      <Button type="submit" size="sm" className="w-fit" disabled={busy || !formState.isDirty}>
        Enregistrer
      </Button>
    </form>
  );
}

function AddProject({
  busy,
  candidates,
  onAdd,
}: {
  busy: boolean;
  candidates: Member[];
  onAdd: (project: Member) => void;
}) {
  const { handleSubmit, register, reset } = useForm({ defaultValues: { project: '' } });
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) =>
        void handleSubmit(({ project }) => {
          const found = candidates.find(({ id }) => String(id) === project);
          if (found) onAdd(found);
          reset();
        })(event)
      }
    >
      <select aria-label="Projet à ajouter" className="select w-56 select-sm" {...register('project')}>
        <option value="">Choisir un projet connu</option>
        {candidates.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={busy || candidates.length === 0}>
        Ajouter des projets
      </Button>
    </form>
  );
}

/**
 * Réglages d'un groupe : son nom, ses projets dans l'ordre (le principal, marqué d'une étoile, en tête), le profil de
 * ses sessions et sa présence dans la barre latérale. Supprimer le groupe ne retire aucun projet. Le téléphone lit.
 */
export function GroupSettings({
  busy,
  group,
  onArrange,
  onBrowse,
  onDelete,
  onProfile,
  onRename,
  onSidebar,
  profiles,
  projects,
  serverError,
}: GroupSettingsProps) {
  const members = group.projects;
  const candidates = projects.filter(({ id }) => !members.some((member) => member.id === id));
  const profile = profiles.find(({ path }) => path === group.profile);
  const sidebarHelp = useId();
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
        Modifiable depuis le poste. Le groupe se règle depuis le poste seulement.
      </p>
      <div className="hidden md:block">
        <Card title="Identité">
          <Identity busy={busy} group={group} serverError={serverError} onRename={onRename} />
        </Card>
      </div>
      <Card title={`Projets · ${members.length}`}>
        <ol aria-label="Projets du groupe" className="flex flex-col divide-y divide-line">
          {members.map((member, index) => (
            <li key={member.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="badge badge-ghost font-mono badge-sm">{index + 1}</span>
              <span className="font-medium">{member.name}</span>
              {index === 0 && (
                <span className="badge gap-1 badge-outline badge-sm">
                  <Star aria-hidden className="size-3" />
                  principal
                </span>
              )}
              <span className="ml-auto hidden gap-1 md:flex">
                {index > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => onArrange([member, ...members.filter(({ id }) => id !== member.id)])}
                  >
                    Définir comme principal
                    <span className="sr-only"> : {member.name}</span>
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => onArrange(members.filter(({ id }) => id !== member.id))}
                >
                  Retirer
                  <span className="sr-only"> {member.name} du groupe</span>
                </Button>
              </span>
            </li>
          ))}
          {members.length === 0 && <li className="py-2 text-muted">Aucun projet dans ce groupe.</li>}
        </ol>
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <AddProject busy={busy} candidates={candidates} onAdd={(project) => onArrange([...members, project])} />
          <Button size="sm" variant="ghost" onClick={onBrowse}>
            <FolderSearch aria-hidden className="size-4" />
            Parcourir les dossiers…
          </Button>
        </div>
      </Card>
      <Card title="Sessions">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Profil</span>
          <select
            className="select hidden w-64 md:inline-flex"
            value={group.profile ?? ''}
            disabled={busy}
            onChange={(event) => onProfile(event.target.value || null)}
          >
            <option value="">Hériter</option>
            {profiles.map(({ label, path }) => (
              <option key={path} value={path}>
                {label}
              </option>
            ))}
          </select>
          <span className="md:hidden">{profile?.label ?? 'Hériter'}</span>
          <span className="text-xs text-muted">{profileOrigin(group.profile, profile !== undefined)}</span>
        </label>
      </Card>
      <Card title="Barre latérale">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            role="switch"
            aria-label="Afficher dans la barre latérale"
            aria-describedby={sidebarHelp}
            className="toggle hidden toggle-primary md:inline-grid"
            checked={group.sidebar}
            disabled={busy}
            onChange={(event) => onSidebar(event.target.checked)}
          />
          <span>
            <span className="block">
              Afficher dans la barre latérale<span className="md:hidden"> : {group.sidebar ? 'oui' : 'non'}</span>
            </span>
            <span id={sidebarHelp} className="block text-xs text-muted">
              {group.sidebar ? 'Le groupe y apparaît.' : 'Le groupe reste utilisable depuis « Tous les projets ».'}
            </span>
          </span>
        </div>
      </Card>
      <div className="hidden items-center gap-3 md:flex">
        <Button variant="destructive" size="sm" disabled={busy} onClick={onDelete}>
          Supprimer le groupe
        </Button>
        <span className="text-xs text-muted">Aucun projet n’est retiré.</span>
      </div>
    </div>
  );
}
