'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { decisionQuery, projectsQuery } from '../../api/context';

export interface LegacyContextRedirectProps {
  /** Ancienne adresse d'une décision (« /context/decisions/6 ») ; null : le contexte d'un projet ou une nouvelle */
  decision: null | number;
  /** La page de modification de la décision */
  edit?: boolean;
  /** Nouvelle décision (« /context/decisions/new ») */
  newDecision?: boolean;
  /** Nom du projet de l'ancienne adresse (« ?project=site-perso ») */
  project: null | string;
  replaces?: null | number;
}

/**
 * Anciennes adresses du contexte, avant que le contexte ne devienne un onglet de la page d'un projet : elles
 * mènent à la même page sous le projet, ou à la liste des projets quand le projet n'existe plus.
 */
export function LegacyContextRedirect({
  decision,
  edit = false,
  newDecision = false,
  project,
  replaces = null,
}: LegacyContextRedirectProps) {
  const router = useRouter();
  const { data: known } = useQuery(projectsQuery);
  const found = useQuery({ ...decisionQuery(decision ?? 0), enabled: decision !== null });
  const name = decision === null ? project : (found.data?.decision.target.name ?? null);
  const waiting = !known || (decision !== null && found.isPending);
  useEffect(() => {
    if (waiting) return;
    const id = known.find((candidate) => candidate.name === name)?.id;
    if (id === undefined) return router.replace('/projects');
    const base = `/projects/${id}/context`;
    if (decision !== null) return router.replace(`${base}/decisions/${decision}${edit ? '/edit' : ''}`);
    const query = replaces === null ? '' : `?replaces=${replaces}`;
    if (newDecision) return router.replace(`${base}/decisions/new${query}`);
    router.replace(base);
  }, [decision, edit, known, name, newDecision, replaces, router, waiting]);
  return <PageSkeleton variant="detail" rows={3} />;
}
