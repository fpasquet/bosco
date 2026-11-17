'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { projectsOverviewQuery } from '../../api/projects';

/**
 * Ancienne vue d'ensemble filtrée sur un projet (« /?project=labo-ia ») : elle mène à la page du projet
 *, ou à la liste des projets quand il n'existe plus.
 */
export function ProjectRedirect({ name }: { name: string }) {
  const router = useRouter();
  const { data } = useQuery(projectsOverviewQuery);
  useEffect(() => {
    if (!data) return;
    const project = data.projects.find((candidate) => candidate.name === name);
    router.replace(project ? `/projects/${project.id}/sessions` : '/projects');
  }, [data, name, router]);
  return <PageSkeleton variant="list" indicators />;
}
