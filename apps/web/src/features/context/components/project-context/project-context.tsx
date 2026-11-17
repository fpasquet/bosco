'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ArchitectureDto } from '@bosco/domain';
import { ContextPreviewDialog } from '@/shared/components/context-preview-dialog';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { contextQuery, previewQuery, projectsQuery, saveArchitecture } from '../../api/context';
import { ContextOverview } from '../context-overview';

/**
 * Onglet Contexte de la page d'un projet : ce que reçoit chaque agent qui y travaille, instructions des groupes,
 * décisions et place dans l'architecture. Il n'y a plus de choix du projet : on arrive par la page du projet.
 */
export function ProjectContext({ projectId }: { projectId: number }) {
  const client = useQueryClient();
  const { data: known } = useQuery(projectsQuery);
  const project = known?.find(({ id }) => id === projectId)?.name ?? null;
  const { data: context } = useQuery({ ...contextQuery(project ?? ''), enabled: project !== null });
  const [previewing, setPreviewing] = useState(false);
  const { data: preview } = useQuery({ ...previewQuery(project ?? ''), enabled: previewing && project !== null });
  const architecture = useMutation({
    mutationFn: (next: ArchitectureDto) => saveArchitecture(project ?? '', next),
    onSuccess: () => client.invalidateQueries({ queryKey: ['context'] }),
  });
  if (!context || project === null) return <SectionSkeleton rows={5} />;
  return (
    <>
      <ContextOverview
        context={context}
        decisionsHref={`/projects/${projectId}/context/decisions`}
        busy={architecture.isPending}
        onPreview={() => {
          void client.invalidateQueries({ queryKey: ['context-preview'] });
          setPreviewing(true);
        }}
        onSaveArchitecture={(next) => architecture.mutate(next)}
      />
      <ContextPreviewDialog
        open={previewing}
        project={project}
        preview={preview}
        onClose={() => setPreviewing(false)}
        onCopy={(text) => void navigator.clipboard?.writeText(text).catch(() => undefined)}
      />
    </>
  );
}
