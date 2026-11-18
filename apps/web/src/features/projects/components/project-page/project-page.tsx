'use client';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { displayPath } from '@/lib/format';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { projectQuery, projectsOverviewQuery, proposalsQuery } from '../../api/projects';
import { ProjectHeader, type ProjectTab } from '../project-header';
import { ProjectMenuButton } from '../project-menu';

export interface ProjectPageProps {
  children: ReactNode;
  /** Étape du fil après le projet : une décision, « Nouvelle décision » ; les onglets s'effacent */
  crumb?: string;
  id: number;
  tab: ProjectTab;
}

/**
 * Page d'un projet : l'en-tête et ses onglets autour du contenu de l'onglet ouvert, dont l'adresse garde
 * la place. Un projet retiré le dit, avec le chemin vers la liste.
 */
export function ProjectPage({ children, crumb, id, tab }: ProjectPageProps) {
  const { data: project, isError } = useQuery(projectQuery(id));
  const { data: overview } = useQuery(projectsOverviewQuery);
  const { data: proposals } = useQuery(proposalsQuery);
  if (isError)
    return (
      <div className="flex flex-col gap-2 p-4 md:px-8 md:pt-6">
        <p>Ce projet n’existe pas ou a été retiré.</p>
        <Link href="/projects" className="link">
          Revenir aux projets
        </Link>
      </div>
    );
  if (!project || !overview) return <PageSkeleton variant="list" indicators={tab === 'sessions'} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <ProjectHeader
        tab={tab}
        crumb={crumb}
        project={{ ...project, path: displayPath(project.path, overview.home) }}
        proposals={(proposals ?? []).filter((decision) => decision.target.name === project.name).length}
        menu={<ProjectMenuButton project={project} variant="header" />}
      />
      {children}
    </div>
  );
}
