'use client';
import { ChevronDown, Folder, FolderGit2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useId, useState } from 'react';
import type { FolderSuggestionDto, GroupDto, ProjectDto, ProjectsDto } from '@bosco/domain';
import { displayPath, sinceNow } from '@/lib/format';
import { Button } from '@/shared/ui/button';
import { groupsOfProject } from '../../lib/groups';
import { sessionsLabel } from '../../lib/selection';
import { AddToGroupMenu } from '../add-to-group-menu';

export interface ProjectsListProps {
  busy: boolean;
  data: ProjectsDto;
  groups: GroupDto[];
  now: Date;
  onAdd: (path: string) => void;
  onAddToGroup: (project: ProjectDto, group: GroupDto) => void;
  onIgnore: (path: string) => void;
  onNewGroup: (project: ProjectDto) => void;
  /** Sur le téléphone, toucher un projet ouvre la feuille de ses actions */
  onOpen: (project: ProjectDto) => void;
  onRestore: (path: string) => void;
  /** Sessions hors de tout projet, listées sous « Hors projet », la plus récente d'abord */
  outsideSessions?: OutsideSession[];
}

/** Une session hors de tout projet : son titre et son dossier de travail. */
export interface OutsideSession {
  id: string;
  lastEventAt: string;
  path: null | string;
  title: string;
}

function SuggestionRow({
  actions,
  home,
  now,
  suggestion,
}: {
  actions: React.ReactNode;
  home: string;
  now: Date;
  suggestion: FolderSuggestionDto;
}) {
  const Icon = suggestion.git ? FolderGit2 : Folder;
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Icon aria-hidden className="size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          {suggestion.name}
          {!suggestion.git && <span className="badge badge-outline badge-sm">sans git</span>}
        </p>
        <p className="truncate font-mono text-xs text-muted">
          {displayPath(suggestion.path, home)} · {sessionsLabel(suggestion.sessions)} ·{' '}
          {sinceNow(new Date(suggestion.lastSessionAt), now)}
        </p>
      </div>
      <div className="hidden gap-2 md:flex">{actions}</div>
    </li>
  );
}

/**
 * Tous les projets : les dossiers ajoutés par la personne avec leurs groupes, la ligne « Hors projet » toujours
 * visible, et les dossiers où une session a tourné hors des projets, à ajouter d'un clic ou à ignorer. Sur le
 * téléphone, tout se lit.
 */
export function ProjectsList({
  busy,
  data,
  groups,
  now,
  onAdd,
  onAddToGroup,
  onIgnore,
  onNewGroup,
  onOpen,
  onRestore,
  outsideSessions = [],
}: ProjectsListProps) {
  const [showIgnored, setShowIgnored] = useState(false);
  const ids = { ignored: useId(), outside: useId(), projects: useId(), suggestions: useId() };
  const { home, ignored, outside, projects, suggestions } = data;
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby={ids.projects} className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <h2 id={ids.projects} className="text-xs font-semibold text-muted">
            Projets
          </h2>
          <span className="badge badge-ghost font-mono badge-sm">{projects.length}</span>
        </div>
        <ul aria-labelledby={ids.projects} className="divide-y divide-line">
          {projects.map((project) => {
            const Icon = project.git ? FolderGit2 : Folder;
            const names = groupsOfProject(groups, project.id).map(({ name }) => name);
            return (
              <li key={project.id} className="flex items-center gap-3 px-4 py-2.5">
                <Icon aria-hidden className="size-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {/* Un clic ouvre la page du projet ; sur le téléphone, la feuille de ses actions */}
                    <Link href={`/projects/${project.id}/sessions`} className="link-hover max-md:hidden">
                      {project.name}
                    </Link>
                    <button type="button" className="text-left md:hidden" onClick={() => onOpen(project)}>
                      {project.name}
                    </button>
                    {!project.git && <span className="badge badge-outline badge-sm">sans git</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    <span className="font-mono">{displayPath(project.path, home)}</span> ·{' '}
                    {names.length > 0 ? names.join(', ') : 'Aucun groupe'}
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap text-muted">
                  {project.lastSessionAt ? sinceNow(new Date(project.lastSessionAt), now) : 'aucune session'}
                </span>
                <div className="hidden md:block">
                  <AddToGroupMenu
                    disabled={busy}
                    groups={groups}
                    project={project}
                    onAdd={(group) => onAddToGroup(project, group)}
                    onNewGroup={() => onNewGroup(project)}
                  />
                </div>
              </li>
            );
          })}
          <li
            id={outsideSessions.length > 0 ? undefined : 'outside'}
            className="flex scroll-mt-4 items-center gap-3 bg-surface-alt px-4 py-2.5 text-muted"
          >
            <FolderOpen aria-hidden className="size-4 shrink-0" />
            <p className="min-w-0 flex-1">Hors projet</p>
            <span className="font-mono text-xs">{sessionsLabel(outside)}</span>
          </li>
        </ul>
      </section>
      {outsideSessions.length > 0 && (
        <section
          id="outside"
          aria-labelledby={ids.outside}
          className="scroll-mt-4 rounded-card border border-line bg-surface shadow-card"
        >
          <div className="border-b border-line px-4 py-2.5">
            <h2 id={ids.outside} className="text-xs font-semibold text-muted">
              Hors projet
            </h2>
            <p className="mt-0.5 text-xs text-muted">Sessions dont le dossier n’est dans aucun projet</p>
          </div>
          <ul aria-labelledby={ids.outside} className="divide-y divide-line">
            {outsideSessions.map((session) => (
              <li key={session.id} className="flex items-baseline gap-2 px-4 py-2.5">
                <Link href={`/sessions/${encodeURIComponent(session.id)}`} className="truncate link-hover">
                  {session.title}
                </Link>
                {session.path && (
                  <span className="truncate font-mono text-xs text-muted">{displayPath(session.path, home)}</span>
                )}
                <span className="ml-auto text-xs whitespace-nowrap text-muted">
                  {sinceNow(new Date(session.lastEventAt), now)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {(suggestions.length > 0 || ignored.length > 0) && (
        <section aria-labelledby={ids.suggestions} className="rounded-card border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-2">
              <h2 id={ids.suggestions} className="text-xs font-semibold text-muted">
                Suggestions
              </h2>
              <span className="badge badge-ghost font-mono badge-sm">{suggestions.length}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Dossiers où une session a tourné, hors de tes projets</p>
          </div>
          <ul aria-labelledby={ids.suggestions} className="divide-y divide-line">
            {suggestions.map((suggestion) => (
              <SuggestionRow
                key={suggestion.path}
                home={home}
                now={now}
                suggestion={suggestion}
                actions={
                  <>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => onAdd(suggestion.path)}>
                      Ajouter
                      <span className="sr-only"> {suggestion.name}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted"
                      disabled={busy}
                      onClick={() => onIgnore(suggestion.path)}
                    >
                      Ignorer
                      <span className="sr-only"> {suggestion.name}</span>
                    </Button>
                  </>
                }
              />
            ))}
            {suggestions.length === 0 && <li className="px-4 py-3 text-muted">Aucune suggestion pour l’instant.</li>}
          </ul>
          {ignored.length > 0 && (
            <div className="border-t border-line">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-muted"
                aria-expanded={showIgnored}
                aria-controls={ids.ignored}
                onClick={() => setShowIgnored(!showIgnored)}
              >
                Ignorés · {ignored.length}
                <ChevronDown aria-hidden className="size-3.5 transition-transform aria-expanded:rotate-180" />
              </button>
              <ul id={ids.ignored} hidden={!showIgnored} aria-label="Ignorés" className="divide-y divide-line">
                {ignored.map((suggestion) => (
                  <SuggestionRow
                    key={suggestion.path}
                    home={home}
                    now={now}
                    suggestion={suggestion}
                    actions={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted"
                        disabled={busy}
                        onClick={() => onRestore(suggestion.path)}
                      >
                        Ne plus ignorer
                        <span className="sr-only"> {suggestion.name}</span>
                      </Button>
                    }
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
