'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ArchitectureDto } from '@bosco/domain';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { Button } from '@/shared/ui/button';
import {
  contextQuery,
  decidedRepositoriesQuery,
  previewQuery,
  repositoriesQuery,
  saveArchitecture,
} from '../../api/context';
import { ContextOverview } from '../context-overview';
import { PreviewDialog } from '../preview-dialog';

/**
 * Contexte d'un dépôt (E9a), choisi parmi les dépôts qui ont une décision à eux ; un dépôt demandé par l'adresse s'y
 * ajoute, même sans décision.
 */
export function ContextScreen({ repository: asked }: { repository: null | string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data: decided } = useQuery(decidedRepositoriesQuery);
  const { data: known } = useQuery(repositoriesQuery);
  const repositories = decided && (asked && !decided.includes(asked) ? [asked, ...decided] : decided);
  const repository = asked ?? repositories?.[0] ?? null;
  // Sans dépôt décidé, la première décision s'écrit pour un dépôt connu, à changer dans le formulaire
  const firstKnown = known?.[0]?.name;
  const { data: context } = useQuery({ ...contextQuery(repository ?? ''), enabled: repository !== null });
  const [previewing, setPreviewing] = useState(false);
  const { data: preview } = useQuery({ ...previewQuery(repository ?? ''), enabled: previewing && repository !== null });
  const architecture = useMutation({
    mutationFn: (next: ArchitectureDto) => saveArchitecture(repository ?? '', next),
    onSuccess: () => client.invalidateQueries({ queryKey: ['context'] }),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs text-muted">Ce que reçoit chaque agent qui travaille dans un dépôt</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Contexte</h1>
        </div>
        {repositories && repositories.length > 0 && (
          <select
            aria-label="Dépôt"
            className="select w-56 select-sm md:ml-auto"
            value={repository ?? ''}
            onChange={(event) => router.push(`/context?repository=${encodeURIComponent(event.target.value)}`)}
          >
            {repositories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>
      {repositories?.length === 0 && known?.length === 0 && (
        <p className="text-muted">
          Aucun dépôt connu pour l’instant : ils viennent des sessions des profils surveillés.
        </p>
      )}
      {repositories?.length === 0 && firstKnown && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted">
            Aucun dépôt n’a encore de décision : elles arrivent proposées par un agent, ou écrites ici.
          </p>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href={`/context/decisions/new?repository=${encodeURIComponent(firstKnown)}`}>
              <Plus aria-hidden className="size-4" />
              Nouvelle décision
            </Link>
          </Button>
        </div>
      )}
      {repository !== null && !context && <SectionSkeleton rows={5} />}
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
      {repository && (
        <PreviewDialog
          open={previewing}
          repository={repository}
          preview={preview}
          onClose={() => setPreviewing(false)}
          onCopy={(text) => void navigator.clipboard?.writeText(text).catch(() => undefined)}
        />
      )}
    </div>
  );
}
