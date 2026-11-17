'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ArchitectureDto } from '@bosco/domain';
import { ContextPreviewDialog } from '@/shared/components/context-preview-dialog';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { Button } from '@/shared/ui/button';
import { contextQuery, decidedProjectsQuery, previewQuery, projectsQuery, saveArchitecture } from '../../api/context';
import { ContextOverview } from '../context-overview';

/**
 * Contexte d'un projet (E9a), choisi parmi les projets qui ont une décision à eux ; un projet demandé par l'adresse s'y
 * ajoute, même sans décision.
 */
export function ContextScreen({ project: asked }: { project: null | string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data: decided } = useQuery(decidedProjectsQuery);
  const { data: known } = useQuery(projectsQuery);
  const projects = decided && (asked && !decided.includes(asked) ? [asked, ...decided] : decided);
  const project = asked ?? projects?.[0] ?? null;
  // Sans projet décidé, la première décision s'écrit pour un projet connu, à changer dans le formulaire
  const firstKnown = known?.[0]?.name;
  const { data: context } = useQuery({ ...contextQuery(project ?? ''), enabled: project !== null });
  const [previewing, setPreviewing] = useState(false);
  const { data: preview } = useQuery({ ...previewQuery(project ?? ''), enabled: previewing && project !== null });
  const architecture = useMutation({
    mutationFn: (next: ArchitectureDto) => saveArchitecture(project ?? '', next),
    onSuccess: () => client.invalidateQueries({ queryKey: ['context'] }),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs text-muted">Ce que reçoit chaque agent qui travaille dans un projet</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Contexte</h1>
        </div>
        {projects && projects.length > 0 && (
          <select
            aria-label="Projet"
            className="select w-56 select-sm md:ml-auto"
            value={project ?? ''}
            onChange={(event) => router.push(`/context?project=${encodeURIComponent(event.target.value)}`)}
          >
            {projects.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>
      {projects?.length === 0 && known?.length === 0 && (
        <p className="text-muted">
          Aucun projet connu pour l’instant : ils viennent des sessions des profils surveillés.
        </p>
      )}
      {projects?.length === 0 && firstKnown && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">
            Aucun projet n’a encore de décision : elles arrivent proposées par un agent, ou écrites ici.
          </p>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={`/context/decisions/new?project=${encodeURIComponent(firstKnown)}`}>
              <Plus aria-hidden className="size-4" />
              Nouvelle décision
            </Link>
          </Button>
        </div>
      )}
      {project !== null && !context && <SectionSkeleton rows={5} />}
      {context && (
        <ContextOverview
          context={context}
          busy={architecture.isPending}
          onPreview={() => {
            void client.invalidateQueries({ queryKey: ['context-preview'] });
            setPreviewing(true);
          }}
          onSaveArchitecture={(next) => architecture.mutate(next)}
        />
      )}
      {project && (
        <ContextPreviewDialog
          open={previewing}
          project={project}
          preview={preview}
          onClose={() => setPreviewing(false)}
          onCopy={(text) => void navigator.clipboard?.writeText(text).catch(() => undefined)}
        />
      )}
    </div>
  );
}
