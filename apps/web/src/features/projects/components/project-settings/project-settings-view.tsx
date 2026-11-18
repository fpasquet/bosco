'use client';
import { Box, Globe, Layers, Monitor, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import type {
  GroupDto,
  ProjectDetailDto,
  ProjectPlaceDto,
  SessionDefaultsDto,
  SessionDefaultsResolvedDto,
} from '@bosco/domain';
import { sinceNow } from '@/lib/format';
import { SectionCard } from '@/shared/components/section-card';
import { SessionDefaultsFields } from '@/shared/components/session-defaults-fields';
import { Button } from '@/shared/ui/button';
import { groupsOfProject } from '../../lib/groups';
import { sessionsLabel } from '../../lib/selection';
import { AddToGroupMenu } from '../add-to-group-menu';

export interface ProjectSettingsViewProps {
  busy: boolean;
  /** Refus de l'API pour le domaine ajouté, posé sous son champ */
  domainError: null | string;
  /** Domaine à ajouter, déjà rempli (une sortie refusée d'une session en bac à sable) */
  draftDomain?: null | string;
  /** Tous les groupes : ceux du projet s'affichent, les autres se proposent */
  groups: GroupDto[];
  /** Ce dont hérite une nouvelle session du projet, avec l'origine de chaque valeur */
  inherited?: SessionDefaultsResolvedDto;
  now: Date;
  onAddDomain: (domain: string) => void;
  onAddToGroup: (group: GroupDto) => void;
  onDefaults: (changes: Partial<SessionDefaultsDto>) => void;
  onNewGroup: () => void;
  onPlace: (place: ProjectPlaceDto) => void;
  onRemove: () => void;
  onRemoveDomain: (domain: string) => void;
  onStartBranch: (branch: null | string) => void;
  /** Profils Claude Code surveillés, que le projet peut prendre par défaut */
  profiles?: readonly { label: string; path: string }[];
  /** Chemin déjà écrit comme dans le terminal (« ~/www/api-tarifs ») */
  project: ProjectDetailDto;
  /** Refus de l'API pour la branche de départ, posé sous son champ */
  startBranchError: null | string;
}

const PLACES: { icon: typeof Monitor; label: string; value: ProjectPlaceDto }[] = [
  { value: 'workstation', label: 'Sur le poste', icon: Monitor },
  { value: 'sandbox', label: 'Bac à sable', icon: Box },
];

function Line({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <dt className="w-44 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function StartBranch({
  busy,
  error,
  onSave,
  project,
}: {
  busy: boolean;
  error: null | string;
  onSave: (branch: null | string) => void;
  project: ProjectDetailDto;
}) {
  const errorId = useId();
  const { formState, handleSubmit, register, reset, setError } = useForm({
    defaultValues: { startBranch: project.startBranch ?? '' },
  });
  useEffect(() => reset({ startBranch: project.startBranch ?? '' }), [project.startBranch, reset]);
  useEffect(() => {
    if (error) setError('startBranch', { type: 'server', message: error });
  }, [error, setError]);
  const message = formState.errors.startBranch?.message;
  return (
    <form
      noValidate
      className="flex flex-wrap items-start gap-2"
      onSubmit={(event) => void handleSubmit(({ startBranch }) => onSave(startBranch.trim() || null))(event)}
    >
      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="font-medium">Branche de départ du bac à sable</span>
        <input
          className="input w-64 font-mono"
          placeholder={project.branch ?? 'branche courante'}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          disabled={!project.git}
          {...register('startBranch')}
        />
        {message ? (
          <span id={errorId} className="text-xs text-danger">
            {message}
          </span>
        ) : (
          <span className="text-xs text-muted">Vide : la branche courante du dossier.</span>
        )}
      </label>
      <Button type="submit" size="sm" variant="outline" className="mt-7" disabled={busy || !formState.isDirty}>
        Enregistrer
      </Button>
    </form>
  );
}

/** Ajout d'un domaine propre au projet ; le champ se vide une fois le domaine dans la liste. */
function AddDomain({
  busy,
  domains,
  draft,
  error,
  onAdd,
}: {
  busy: boolean;
  domains: string[];
  draft: null | string;
  error: null | string;
  onAdd: (domain: string) => void;
}) {
  const errorId = useId();
  // Un domaine déjà dans la liste ne se propose plus : le champ se vide une fois qu'il y est
  const initial = draft && !domains.includes(draft) ? draft : '';
  const { formState, handleSubmit, register, reset, setError, setFocus } = useForm({
    defaultValues: { domain: initial },
  });
  useEffect(() => {
    if (draft) setFocus('domain');
  }, [draft, setFocus]);
  useEffect(() => reset({ domain: initial }), [domains, initial, reset]);
  useEffect(() => {
    if (error) setError('domain', { type: 'server', message: error });
  }, [error, setError]);
  const message = formState.errors.domain?.message;
  return (
    <form
      noValidate
      className="flex flex-wrap items-start gap-2"
      onSubmit={(event) => void handleSubmit(({ domain }) => onAdd(domain.trim()))(event)}
    >
      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="sr-only">Ajouter un domaine</span>
        <input
          className="input w-64 font-mono"
          placeholder="Ajouter un domaine"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          {...register('domain', { validate: (value) => value.trim() !== '' || 'Écris un nom de domaine.' })}
        />
        {message && (
          <span id={errorId} className="text-xs text-danger">
            {message}
          </span>
        )}
      </label>
      <Button type="submit" size="sm" variant="outline" className="mt-1" disabled={busy}>
        Ajouter<span className="sr-only"> le domaine</span>
      </Button>
    </form>
  );
}

/**
 * Réglages d'un projet : son identité, ses groupes, où tournent ses nouvelles sessions et la branche que copie
 * un bac à sable, ses domaines propres pour le bac à sable, puis son retrait, volontairement discret. Sur le téléphone, tout se lit.
 */
export function ProjectSettingsView({
  busy,
  domainError,
  draftDomain = null,
  groups,
  inherited,
  now,
  onAddDomain,
  onAddToGroup,
  onDefaults,
  onNewGroup,
  onPlace,
  onRemove,
  onRemoveDomain,
  onStartBranch,
  profiles = [],
  project,
  startBranchError,
}: ProjectSettingsViewProps) {
  const joined = groupsOfProject(groups, project.id);
  const place = project.place ?? 'workstation';
  const placeHelp = useId();
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="rounded-card border border-line bg-surface-alt px-4 py-3 text-xs text-muted md:hidden">
        Modifiable depuis le poste. Le retrait d’un projet aussi.
      </p>
      <SectionCard title="Identité">
        <dl className="flex flex-col gap-2">
          <Line label="Nom affiché">{project.name}</Line>
          <Line label="Chemin">
            <span className="font-mono">{project.path}</span>
          </Line>
          <Line label="Branche principale">
            <span className="font-mono">{project.branch ?? (project.git ? 'commit détaché' : '—')}</span>
          </Line>
        </dl>
      </SectionCard>
      <SectionCard title="Groupes">
        <div className="flex flex-wrap items-center gap-2">
          {joined.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}/settings`} className="badge gap-1.5 badge-outline">
              <Layers aria-hidden className="size-3" />
              {group.name}
            </Link>
          ))}
          {joined.length === 0 && <span className="text-muted">Aucun groupe</span>}
          <span className="hidden md:inline-flex">
            <AddToGroupMenu
              disabled={busy}
              groups={groups}
              project={project}
              onAdd={onAddToGroup}
              onNewGroup={onNewGroup}
            />
          </span>
        </div>
      </SectionCard>
      <SectionCard title="Sessions">
        <SessionDefaultsFields
          busy={busy}
          defaults={project.defaults}
          inherited={inherited}
          profiles={profiles}
          onChange={onDefaults}
        />
        <fieldset className="flex flex-col gap-1.5" aria-describedby={placeHelp}>
          <legend className="mb-1.5 font-medium">Où elle tourne par défaut</legend>
          <div className="hidden grid-cols-2 gap-2 sm:w-96 md:grid">
            {PLACES.map(({ icon: Icon, label, value }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2"
              >
                <input
                  type="radio"
                  name="place"
                  className="radio radio-sm"
                  checked={place === value}
                  disabled={busy || (value === 'sandbox' && !project.git)}
                  onChange={() => onPlace(value)}
                />
                <Icon aria-hidden className="size-4 text-muted" />
                {label}
              </label>
            ))}
          </div>
          <span className="md:hidden">{PLACES.find(({ value }) => value === place)?.label}</span>
          <span id={placeHelp} className="text-xs text-muted">
            {project.git
              ? 'Dernier choix d’une nouvelle session dans ce projet.'
              : `Bac à sable indisponible : ${project.name} n’est pas un dépôt git.`}
          </span>
        </fieldset>
        {project.git && (
          <>
            <div className="hidden md:block">
              <StartBranch busy={busy} error={startBranchError} onSave={onStartBranch} project={project} />
            </div>
            <p className="md:hidden">
              Branche de départ :{' '}
              <span className="font-mono">{project.startBranch ?? project.branch ?? 'branche courante'}</span>
            </p>
          </>
        )}
      </SectionCard>
      <SectionCard title="Domaines du projet">
        <p className="text-xs text-muted">S’ajoutent à la liste générale des domaines autorisés du bac à sable.</p>
        {project.domains.length === 0 ? (
          <p className="text-muted">Aucun domaine propre au projet.</p>
        ) : (
          <ul aria-label="Domaines du projet" className="flex flex-wrap gap-2">
            {project.domains.map((domain) => (
              <li key={domain} className="badge gap-1.5 badge-outline font-mono">
                <Globe aria-hidden className="size-3" />
                {domain}
                <button
                  type="button"
                  className="hidden cursor-pointer text-muted hover:text-ink md:inline-flex"
                  aria-label={`Retirer ${domain}`}
                  disabled={busy}
                  onClick={() => onRemoveDomain(domain)}
                >
                  <X aria-hidden className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="hidden md:block">
          <AddDomain
            busy={busy}
            domains={project.domains}
            draft={draftDomain}
            error={domainError}
            onAdd={onAddDomain}
          />
        </div>
      </SectionCard>
      <SectionCard title="Activité">
        <dl className="flex flex-col gap-2">
          <Line label="Sessions lues">{sessionsLabel(project.sessions)}</Line>
          <Line label="Dernière session">
            {project.lastSessionAt ? sinceNow(new Date(project.lastSessionAt), now) : 'aucune'}
          </Line>
        </dl>
      </SectionCard>
      <div className="hidden items-center gap-3 md:flex">
        <Button variant="ghost" size="sm" className="text-danger" disabled={busy} onClick={onRemove}>
          Retirer le projet
        </Button>
        <span className="text-xs text-muted">Ne touche à rien sur le poste.</span>
      </div>
    </div>
  );
}
