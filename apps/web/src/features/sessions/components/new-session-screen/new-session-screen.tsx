'use client';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Download,
  EyeOff,
  GitBranch,
  Globe,
  KeyRound,
  MessageSquare,
  Monitor,
  Moon,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { GroupDto, PilotOptionsDto, SessionDefaultsResolvedDto, SessionDto, StartSessionDto } from '@bosco/domain';
import { displayPath } from '@/lib/format';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { originLabel } from '@/shared/lib/session-settings';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { groupQuery, groupsQuery } from '../../api/groups';
import { isolationQuery, pilotDefaultsQuery, pilotOptionsQuery, startSession, suggestions } from '../../api/pilot';
import { sessionsQuery } from '../../api/sessions';
import { sourcesQuery } from '../../api/sources';
import { useFullAccess } from '../../hooks/use-full-access';
import {
  groupProjects,
  namesList,
  openIn,
  type OptionProject,
  projectsOffer,
  sandboxDomains,
  withPrincipal,
} from '../../lib/new-session';
import {
  choicesAfter,
  effectiveSettings,
  NO_CHOICES,
  type SessionChoices,
  settingsOrigins,
} from '../../lib/session-choices';
import { Composer, type ComposerValue } from '../composer';
import { FullAccessDialog } from '../full-access-dialog';
import { ProjectsField } from '../projects-field';

/** Récapitulatif d'une session sur le poste : le projet principal, et ceux qu'elle voit en plus. */
function WorkstationSummary({ others, principal }: { others: string[]; principal: string }) {
  return (
    <>
      <p className="flex gap-2">
        <Monitor aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {others.length === 0
          ? 'Sur ce poste, dans le dossier du projet, comme dans un terminal.'
          : `Sur ce poste, dans ${principal} ; elle voit aussi ${namesList(others)}.`}
      </p>
      <p className="text-xs font-semibold text-muted">Ensuite</p>
      <p className="flex gap-2">
        <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Elle s’ouvre dans Bosco : tu lui écris depuis le poste ou le téléphone.
      </p>
      <p className="flex gap-2">
        <SquareTerminal aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {others.length === 0
          ? 'Elle se reprend aussi dans un terminal entre deux tours.'
          : 'Elle se reprend aussi dans un terminal entre deux tours, avec les autres projets ajoutés à la commande.'}
      </p>
    </>
  );
}

/**
 * Récapitulatif d'une session en bac à sable : ce que voit l'agent, les domaines réunis, et
 * comment le travail revient.
 */
function SandboxSummary({ branch, domains, names }: { branch: string; domains: number; names: string[] }) {
  const several = names.length > 1;
  return (
    <>
      <p className="flex gap-2">
        <Box aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Dans un bac à sable sur ce poste, isolé du reste du poste.
      </p>
      <p className="text-xs font-semibold text-muted">Ce que voit l’agent</p>
      <p className="flex gap-2">
        <GitBranch aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {several
          ? `Une copie de chacun des ${names.length} projets, sur ${branch}`
          : `Une copie de ${names[0]}, sur ${branch}`}
      </p>
      <p className="flex gap-2">
        <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        L’accès à l’abonnement choisi
      </p>
      <p className="flex gap-2">
        <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        <span>
          {several
            ? `${domains} domaines, ceux des ${names.length} projets · `
            : 'Les domaines autorisés du bac à sable · '}
          <Link href="/settings/sandbox" className="link">
            Voir
          </Link>
        </span>
      </p>
      <p className="flex gap-2 text-muted">
        <EyeOff aria-hidden className="mt-0.5 size-4 shrink-0" />
        Rien d’autre du poste : ni fichiers, ni accès, ni autres projets
      </p>
      <p className="text-xs font-semibold text-muted">Ensuite</p>
      <p className="flex gap-2">
        <Download aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {several
          ? '« Récupérer les branches » ramène le travail dans chaque projet qui en a, quand tu veux.'
          : '« Récupérer la branche » ramène le travail dans le projet, quand tu veux.'}
      </p>
      <p className="flex gap-2">
        <Moon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        Le bac à sable s’arrête après 30 min sans message, sans rien perdre.
      </p>
    </>
  );
}

/** Fil d'Ariane et retour d'une nouvelle session, selon la page d'où elle part. */
function originOf(
  origin: NewSessionOrigin,
  group: GroupDto | null,
  projects: readonly { id: number; name: string }[],
): { back: string; crumbs: { href: string; label: string }[] } {
  if (group) {
    const back = `/groups/${group.id}/sessions`;
    return {
      back,
      crumbs: [
        { href: '/projects', label: 'Groupes' },
        { href: back, label: group.name },
      ],
    };
  }
  const project = projects.find(({ id }) => id === origin.project);
  if (project) {
    const back = `/projects/${project.id}/sessions`;
    return {
      back,
      crumbs: [
        { href: '/projects', label: 'Projets' },
        { href: back, label: project.name },
      ],
    };
  }
  return { back: '/', crumbs: [] };
}

/** D'où part la nouvelle session : la vue d'ensemble, la page d'un projet ou celle d'un groupe. */
export interface NewSessionOrigin {
  group: null | number;
  project: null | number;
}

/** « 3 fichiers modifiés du poste non copiés », ou « — » quand la copie prend tout. */
function uncopied(changes: null | number): string {
  if (!changes) return '—';
  return changes > 1 ? `${changes} fichiers modifiés du poste non copiés` : '1 fichier modifié du poste non copié';
}

/**
 * Copies d'une session à plusieurs projets en bac à sable : pour chaque projet, d'où part sa copie et ce qui
 * n'y entre pas.
 */
function SandboxCopies({
  from,
  onFrom,
  projects,
}: {
  from: (project: OptionProject) => string;
  onFrom: (root: string, branch: string) => void;
  projects: OptionProject[];
}) {
  return (
    <div className="overflow-x-auto rounded-control border border-line sm:col-span-2">
      <table className="table table-sm">
        <caption className="sr-only">Copies des projets</caption>
        <thead className="text-xs text-muted">
          <tr>
            <th className="font-medium">Projet</th>
            <th className="font-medium">Partir de</th>
            <th className="font-medium">Copie</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.root}>
              <td>{project.name}</td>
              <td>
                <input
                  className="input w-40 font-mono input-sm"
                  aria-label={`Partir de, pour ${project.name}`}
                  value={from(project)}
                  onChange={(event) => onFrom(project.root, event.target.value)}
                />
              </td>
              <td className="text-xs text-muted">{uncopied(project.changes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Projets où une session du terminal est encore ouverte : un avertissement chacun, sauf en bac à sable. */
function busyProjects(
  sessions: readonly SessionDto[],
  chosen: readonly OptionProject[],
  sandboxed: boolean,
): { project: OptionProject; session: SessionDto }[] {
  if (sandboxed) return [];
  return chosen.flatMap((project) => {
    const session = openIn(sessions, project.root);
    return session ? [{ project, session }] : [];
  });
}

/** Démarre la session, puis l'ouvre ; un refus de Bosco s'affiche en message bref. */
function useStartSession(): (input: StartSessionDto) => Promise<void> {
  const router = useRouter();
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  return async (input) => {
    try {
      const sessionId = await startSession(input);
      await client.invalidateQueries({ queryKey: ['sessions'] });
      router.push(`/sessions/${sessionId}`);
    } catch (error) {
      push(error instanceof Error ? error.message : 'La session n’a pas démarré.', 'warning');
      throw error;
    }
  };
}

/**
 * Avertissement non bloquant, pour chaque projet où une session du terminal est encore ouverte, nommé quand la session
 * a plusieurs projets ; « Voir la session » ouvre l'autre session.
 */
function BusyWarnings({ busy, named }: { busy: { project: OptionProject; session: SessionDto }[]; named: boolean }) {
  return busy.map(({ project, session }) => (
    <div key={project.root} role="alert" className="alert alert-soft alert-warning">
      <TriangleAlert aria-hidden className="size-4" />
      <span>
        {named ? (
          <>
            <b className="font-semibold">{project.name}</b> : une session est déjà ouverte dans ce dossier
          </>
        ) : (
          'Une session est déjà ouverte dans ce dossier'
        )}
        , dans un terminal : les deux agents modifieraient les mêmes fichiers.{' '}
        <Link href={`/sessions/${session.id}`} className="link font-medium">
          Voir la session
        </Link>
      </span>
    </div>
  ));
}

/**
 * Branches d'une session en bac à sable : d'où part la copie de chaque projet, et la branche de la
 * session, la même dans chacun.
 */
function SandboxFields({
  branch,
  chosen,
  from,
  onBranch,
  onFrom,
}: {
  branch: string;
  chosen: OptionProject[];
  from: (project: OptionProject) => string;
  onBranch: (branch: string) => void;
  onFrom: (root: string, branch: string) => void;
}) {
  const [principal] = chosen;
  const several = chosen.length > 1;
  const start = principal ? from(principal) : '';
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {several || !principal ? (
        <SandboxCopies projects={chosen} from={from} onFrom={onFrom} />
      ) : (
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-sm font-medium">Partir de</span>
          <input
            className="input w-full font-mono"
            value={start}
            onChange={(event) => onFrom(principal.root, event.target.value)}
          />
        </label>
      )}
      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-medium">Branche de la session</span>
        <input
          className="input w-full font-mono"
          placeholder="bosco/s-… d’après le premier message"
          value={branch}
          onChange={(event) => onBranch(event.target.value)}
        />
      </label>
      <p className="text-xs text-muted sm:col-span-2">
        {several
          ? `Créée dans chacun des ${chosen.length} projets ; un nom déjà pris dans l’un d’eux est refusé. Chaque copie prend sa branche telle qu’enregistrée.`
          : `Copie de ${start || 'la branche courante'} telle qu’enregistrée : les fichiers modifiés du poste ne sont pas copiés.`}
      </p>
    </div>
  );
}

/** En-tête : le fil d'Ariane selon l'origine, le groupe et le projet principal, et « Annuler ». */
function Header({
  group,
  principal,
  start,
}: {
  group: null | string;
  principal: null | string;
  start: { back: string; crumbs: { href: string; label: string }[] };
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-0">
        <Breadcrumbs items={[...start.crumbs, { label: 'Nouvelle session' }]} />
        <h1 className="mt-1 hidden font-display text-2xl font-semibold tracking-tight md:block">Nouvelle session</h1>
        {group && principal && (
          <p className="text-xs text-muted">
            Avec le groupe {group} · projet principal {principal}
          </p>
        )}
      </div>
      <Link href={start.back} className="ml-auto link text-sm text-muted">
        Annuler
      </Link>
    </div>
  );
}

/** Récapitulatif de droite : où la session tourne, ce que voit l'agent et comment elle se poursuit. */
function Summary({
  branch,
  chosen,
  general,
  sandboxed,
}: {
  branch: string;
  chosen: OptionProject[];
  general: string[];
  sandboxed: boolean;
}) {
  const names = chosen.map(({ name }) => name);
  return (
    <aside className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 text-sm shadow-card">
      <h2 className="font-semibold">Récapitulatif</h2>
      <p className="text-xs font-semibold text-muted">Où elle tourne</p>
      {sandboxed && names.length > 0 ? (
        <SandboxSummary
          names={names}
          branch={branch.trim() || 'sa propre branche'}
          domains={sandboxDomains(general, chosen).length}
        />
      ) : (
        <WorkstationSummary principal={names[0] ?? ''} others={names.slice(1)} />
      )}
    </aside>
  );
}

/** Branche de départ d'une copie : celle saisie, sinon celle réglée pour le projet, sinon sa branche courante. */
function startFrom(typed: Readonly<Record<string, string>>, project: OptionProject): string {
  return typed[project.root] ?? project.startBranch ?? project.branch ?? '';
}

/** Pourquoi le bac à sable est grisé : Docker, ou un projet de la session sans git ; null s'il est possible. */
function sandboxReason(unavailable: null | string, chosen: readonly OptionProject[]): null | string {
  // Un projet sans git ne se copie pas dans un bac à sable : la session tourne alors seulement sur le poste
  const withoutGit = chosen.find(({ git }) => !git);
  return unavailable ?? (withoutGit ? `${withoutGit.name} n’est pas un dépôt git` : null);
}

/** Bac à sable demandé au démarrage : la branche de la session et la branche de départ de chaque projet. */
function sandboxChoice(branch: string, chosen: readonly OptionProject[], fromOf: (project: OptionProject) => string) {
  const [principal, ...others] = chosen;
  return {
    branch: branch.trim() || null,
    startBranch: (principal && fromOf(principal).trim()) || null,
    startBranches: Object.fromEntries(others.map((other) => [other.root, fromOf(other).trim() || null])),
  };
}

/** Projets d'une session partie d'un groupe (ses projets, le principal en tête) ou d'un projet. */
function originRoots(
  group: GroupDto | undefined,
  projects: readonly OptionProject[],
  project: null | number,
): string[] {
  if (group) return groupProjects(group, projects);
  const found = projects.find(({ id }) => id === project) ?? projects[0];
  return found ? [found.root] : [];
}

/** Abonnement Claude d'une nouvelle session : la valeur par défaut dit d'où elle vient (« profil par défaut »). */
function ProfileSelect({
  defaults,
  onChange,
  profile,
  profiles,
}: {
  defaults: SessionDefaultsResolvedDto | undefined;
  onChange: (profile: null | string) => void;
  profile: null | string;
  profiles: PilotOptionsDto['profiles'];
}) {
  const origin = defaults && defaults.profile.value === profile ? originLabel(defaults.profile.origin) : null;
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium">Abonnement Claude</span>
      <select
        className="select w-full"
        value={profile ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        {profiles.length === 0 && <option value="">Aucun profil avec un accès Claude</option>}
        {profiles.map(({ account, label, path }) => (
          <option key={path} value={path}>
            {label}
            {path === profile && origin ? ` · ${origin}` : ''}
            {account ? ` · ${account}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/** « Où elle tourne » : sur le poste, ou dans un bac à sable, grisé avec sa raison. */
function WhereField({
  onChoose,
  unavailable,
  where,
}: {
  onChoose: (where: 'sandbox' | 'workstation') => void;
  unavailable: null | string;
  where: 'sandbox' | 'workstation';
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">Où elle tourne</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2">
          <input
            type="radio"
            name="where"
            className="radio radio-sm"
            checked={where === 'workstation'}
            onChange={() => onChoose('workstation')}
          />
          <Monitor aria-hidden className="size-4 text-muted" />
          Sur le poste
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-control border border-line bg-surface px-3 py-2">
          <input
            type="radio"
            name="where"
            className="radio radio-sm"
            checked={where === 'sandbox'}
            disabled={Boolean(unavailable)}
            onChange={() => onChoose('sandbox')}
          />
          <Box aria-hidden className="size-4 text-muted" />
          Bac à sable
        </label>
      </div>
      {unavailable && <span className="text-xs text-muted">Bac à sable indisponible : {unavailable}.</span>}
    </fieldset>
  );
}

/**
 * Nouvelle session : les projets, un seul ou ceux d'un groupe, le principal
 * en tête, et l'abonnement Claude ; où elle tourne (sur le poste ou dans un bac à sable, une copie par projet sur sa
 * propre branche), puis le premier message, avec les réglages du tour dans la barre d'outils, chacun avec son origine
 *. L'accès complet sur le poste se confirme à chaque session. Elle s'ouvre dans Bosco. Partie d'un projet
 * ou d'un groupe, elle le reprend, avec son fil d'Ariane.
 */
export function NewSessionScreen({ origin }: { origin: NewSessionOrigin }) {
  const { data: options } = useQuery(pilotOptionsQuery);
  const { data: group } = useQuery({ ...groupQuery(origin.group ?? 0), enabled: origin.group !== null });
  if (!options || (origin.group !== null && !group)) return <PageSkeleton variant="detail" rows={6} />;
  return <NewSessionForm origin={origin} options={options} group={group ?? null} />;
}

function NewSessionForm({
  group,
  options,
  origin,
}: {
  group: GroupDto | null;
  options: PilotOptionsDto;
  origin: NewSessionOrigin;
}) {
  const open = useStartSession();
  const fullAccess = useFullAccess();
  const { data: sessions } = useQuery(sessionsQuery);
  const { data: groups } = useQuery(groupsQuery);
  const { data: isolation } = useQuery(isolationQuery);
  // Le dossier du projet s'écrit comme dans le terminal, depuis ~
  const { data: sources } = useQuery(sourcesQuery);
  const [chosenRoots, setChosenRoots] = useState<null | string[]>(null);
  const [chosenGroup, setGroup] = useState<null | { id: number; name: string }>(null);
  const [chosenProfile, setProfile] = useState<null | string>(null);
  const [choices, setChoices] = useState<SessionChoices>(NO_CHOICES);
  // L'accès complet confirmé pour cette session : le démarrage ne le redemande pas
  const [confirmed, setConfirmed] = useState(false);
  const [chosenWhere, setWhere] = useState<'sandbox' | 'workstation' | null>(null);
  const [startBranches, setStartBranches] = useState<Record<string, string>>({});
  const [branch, setBranch] = useState('');
  // Partie d'un groupe, la session prend ses projets, le principal en tête ; d'un projet, ce projet
  const roots = chosenRoots ?? originRoots(group ?? undefined, options.projects, origin.project);
  const chosen = roots.flatMap((root) => options.projects.filter((candidate) => candidate.root === root));
  const project = chosen[0] ?? null;
  const others = chosen.slice(1);
  const sessionGroup = chosenRoots === null && group ? group : chosenGroup;
  // « Où elle tourne » reprend le dernier choix fait pour le projet principal
  const where = chosenWhere ?? project?.place ?? 'workstation';
  const sandboxUnavailable = sandboxReason(options.sandboxUnavailable, chosen);
  const sandboxed = where === 'sandbox' && !sandboxUnavailable;
  const { data: defaults } = useQuery({
    ...pilotDefaultsQuery({
      group: sessionGroup?.id ?? null,
      profile: chosenProfile,
      project: project?.root ?? null,
      sandbox: sandboxed,
    }),
    enabled: project !== null,
    placeholderData: keepPreviousData,
  });
  const profile = chosenProfile ?? defaults?.profile.value ?? options.profiles[0]?.path ?? null;
  const settings = effectiveSettings(choices, defaults);
  // Le bac à sable travaille sur ses propres copies : une session du terminal dans le même dossier ne le gêne pas
  const busy = busyProjects(sessions ?? [], chosen, sandboxed);
  const fromOf = (candidate: OptionProject) => startFrom(startBranches, candidate);
  const changeProjects = (next: string[]) => {
    setChosenRoots(next);
    setProfile(null);
  };
  const changeSettings = (next: typeof settings) => {
    const apply = () => setChoices(choicesAfter(choices, settings, next));
    // Sur le poste, choisir l'accès complet demande une confirmation, à chaque session
    if (next.permissionMode === 'bypassPermissions' && settings.permissionMode !== next.permissionMode && !sandboxed)
      fullAccess.ask(() => {
        apply();
        setConfirmed(true);
      });
    else apply();
  };
  const start = async (value: ComposerValue) => {
    if (!project) return;
    await open({
      ...value,
      group: sessionGroup?.id ?? null,
      profile,
      project: project.root,
      projects: others.map(({ root }) => root),
      settings: choices,
      sandbox: sandboxed ? sandboxChoice(branch, chosen, fromOf) : null,
    });
  };
  // Un accès complet venu d'un réglage par défaut se confirme aussi au démarrage, sauf en bac à sable
  const submit = (value: ComposerValue) =>
    settings.permissionMode === 'bypassPermissions' && !sandboxed && !confirmed
      ? fullAccess.askBeforeStart(() => start(value))
      : start(value);
  const crumbs = originOf(origin, group, options.projects);
  const offer = projectsOffer(groups ?? [], options.projects, roots);
  const general = isolation ? [...isolation.domains.locked, ...isolation.domains.added] : [];
  return (
    <div className="flex flex-col gap-5 p-4 md:px-8 md:pt-6">
      <Header start={crumbs} group={sessionGroup?.name ?? null} principal={project?.name ?? null} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
          {project ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <ProjectsField
                    chosen={chosen}
                    group={sessionGroup ? { id: sessionGroup.id, name: sessionGroup.name } : null}
                    offer={offer}
                    onAdd={(root) => changeProjects([...roots, root])}
                    onChooseGroup={(next) => {
                      changeProjects(groupProjects(next, options.projects));
                      setGroup({ id: next.id, name: next.name });
                    }}
                    onDropGroup={() => {
                      setChosenRoots(roots);
                      setGroup(null);
                      setProfile(null);
                    }}
                    onPrincipal={(root) => changeProjects(withPrincipal(roots, root))}
                    onRemove={(root) => changeProjects(roots.filter((candidate) => candidate !== root))}
                  />
                  <span className="truncate font-mono text-xs text-muted">
                    {displayPath(project.root, sources?.home ?? '')}
                    {project.branch && ` · ${project.branch}`}
                    {project.changes ? ` · ${project.changes} modifiés` : ''}
                  </span>
                </div>
                <ProfileSelect
                  defaults={defaults}
                  profile={profile}
                  profiles={options.profiles}
                  onChange={setProfile}
                />
              </div>
              <WhereField where={where} unavailable={sandboxUnavailable} onChoose={setWhere} />
              {sandboxed && (
                <SandboxFields
                  branch={branch}
                  chosen={chosen}
                  from={fromOf}
                  onBranch={setBranch}
                  onFrom={(root, value) => setStartBranches({ ...startBranches, [root]: value })}
                />
              )}
              <BusyWarnings busy={busy} named={chosen.length > 1} />
              <Composer
                label="Premier message"
                placeholder="Que doit faire l’agent ?"
                settings={settings}
                origins={settingsOrigins(choices, defaults)}
                onSettingsChange={changeSettings}
                onSubmit={submit}
                suggest={(kind, query) => suggestions({ profile, project: project.root }, kind, query)}
                submitLabel="Démarrer"
                minRows={4}
              />
            </>
          ) : (
            <p className="rounded-card border border-line bg-surface p-4 text-muted">
              Aucun projet connu : Bosco découvre les projets par les sessions des profils surveillés.
            </p>
          )}
        </div>
        <Summary branch={branch} chosen={chosen} general={general} sandboxed={sandboxed} />
      </div>
      <FullAccessDialog
        open={fullAccess.open}
        project={project?.name ?? ''}
        onCancel={fullAccess.cancel}
        onConfirm={fullAccess.confirm}
        onSandbox={
          sandboxUnavailable
            ? undefined
            : () => {
                // En bac à sable, l'accès complet ne demande rien : le formulaire passe au bac à sable en le gardant
                setChoices({ ...choices, permissionMode: 'bypassPermissions' });
                setWhere('sandbox');
                fullAccess.cancel();
              }
        }
      />
    </div>
  );
}
