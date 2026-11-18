import type { ReactNode } from 'react';
import { Folder, FolderGit2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { LinkTabs } from '@/shared/ui/link-tabs';

export type ProjectTab = 'context' | 'sessions' | 'settings';

export interface ProjectHeaderProps {
  /** Étape du fil après l'onglet : une décision (« DEC-6 »), « Nouvelle décision » */
  crumb?: string;
  /** Menu ⋯ du projet, le même que dans la barre latérale ; absent sur le téléphone */
  menu?: ReactNode;
  project: { branch: null | string; git: boolean; id: number; name: string; path: string };
  /** Décisions proposées par un agent qui attendent la validation : leur nombre suit « Contexte » */
  proposals: number;
  tab: ProjectTab;
}

/**
 * En-tête de toute page d'un projet : sa place (« Projets › api-tarifs »), son nom, son dossier et sa branche,
 * « Nouvelle session » qui part de lui, le menu ⋯ et les onglets Sessions, Contexte et Réglages.
 */
export function ProjectHeader({ crumb, menu, project, proposals, tab }: ProjectHeaderProps) {
  const base = `/projects/${project.id}`;
  const Icon = project.git ? FolderGit2 : Folder;
  const items = [
    { href: '/projects', label: 'Projets' },
    ...(tab === 'context' || crumb ? [{ href: `${base}/${tab}`, label: project.name }] : [{ label: project.name }]),
    ...(tab === 'context' && !crumb ? [{ label: 'Contexte' }] : []),
    ...(crumb ? [{ label: crumb }] : []),
  ];
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <Breadcrumbs items={items} />
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
            <Icon aria-hidden className="size-5 text-muted" />
            <span className="truncate">{project.name}</span>
            {project.git ? (
              <span className="badge badge-outline font-mono badge-sm">git</span>
            ) : (
              <span className="badge badge-outline badge-sm">sans git</span>
            )}
          </h1>
          <p className="truncate font-mono text-xs text-muted">
            {project.path}
            {project.branch && ` · ${project.branch}`}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 md:ml-auto md:w-auto">
          <Link href={`/sessions/new?project=${project.id}`} className="btn flex-1 btn-primary md:flex-none">
            <Plus aria-hidden className="size-4" />
            Nouvelle session
          </Link>
          {menu && <span className="hidden md:inline-flex">{menu}</span>}
        </div>
      </div>
      {!crumb && (
        <LinkTabs
          label="Onglets du projet"
          current={`${base}/${tab}`}
          tabs={[
            { href: `${base}/sessions`, label: 'Sessions' },
            { href: `${base}/context`, label: 'Contexte', count: proposals },
            { href: `${base}/settings`, label: 'Réglages' },
          ]}
        />
      )}
    </header>
  );
}
