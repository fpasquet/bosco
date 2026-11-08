'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/ui/button';
import { ContextRefused, repositoriesQuery, saveSocle, soclesQuery } from '../../api/context';
import { concernedRepositories } from '../../lib/socles';
import { SocleForm } from '../socle-form';
import { SocleImpactDialog } from '../socle-impact-dialog';
import { SoclesList } from '../socles-list';

/** Socles (E14a) : lecture seule sur le téléphone. */
export function SoclesScreen() {
  const { data: socles } = useQuery(soclesQuery);
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="text-xs text-muted">
            <Link href="/context" className="link">
              Contexte
            </Link>{' '}
            › Socles
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Socles</h1>
        </div>
        <Button asChild size="sm" className="hidden md:ml-auto md:inline-flex">
          <Link href="/context/socles/new">
            <Plus aria-hidden className="size-4" />
            Nouveau socle
          </Link>
        </Button>
      </div>
      {socles && <SoclesList socles={socles} />}
      <p className="text-xs text-muted md:hidden">Créer un socle ou gérer ses dépôts se fait depuis le poste.</p>
    </div>
  );
}

/** Nouveau socle (E14b). */
export function NewSocleScreen() {
  const router = useRouter();
  const client = useQueryClient();
  const { data: socles } = useQuery(soclesQuery);
  const { data: repositories } = useQuery(repositoriesQuery);
  const [error, setError] = useState<null | string>(null);
  const create = useMutation({
    mutationFn: (socle: Parameters<typeof saveSocle>[1]) => saveSocle(null, socle),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['socles'] });
      router.push('/context/socles');
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'Le socle n’a pas pu être créé.'),
  });
  if (!socles || !repositories) return <PageSkeleton variant="list" rows={3} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Nouveau socle</h1>
      <p className="text-muted md:hidden">Un socle se crée depuis le poste.</p>
      <div className="hidden md:block">
        <SocleForm
          socles={socles}
          repositories={repositories.map(({ name }) => name)}
          busy={create.isPending}
          serverError={error}
          onCancel={() => router.back()}
          onSubmit={(socle) => create.mutate(socle)}
        />
      </div>
    </div>
  );
}

type SocleChange = Parameters<typeof saveSocle>[1];

/** Modifier un socle (E14a) : le formulaire de E14b prérempli, puis la confirmation des dépôts concernés (CA-CONT-58). */
export function EditSocleScreen({ id }: { id: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data: socles } = useQuery(soclesQuery);
  const { data: repositories } = useQuery(repositoriesQuery);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState<null | SocleChange>(null);
  const save = useMutation({
    mutationFn: (socle: SocleChange) => saveSocle(id, socle),
    onSuccess: async () => {
      setPending(null);
      await client.invalidateQueries();
      router.push('/context/socles');
    },
    onError: (failure) => {
      setPending(null);
      setError(failure instanceof ContextRefused ? failure.message : 'Le socle n’a pas pu être enregistré.');
    },
  });
  if (!socles || !repositories) return <PageSkeleton variant="form" rows={4} />;
  const socle = socles.find((candidate) => candidate.id === id);
  if (!socle) return <p className="p-4 md:px-8 md:pt-6">Socle introuvable.</p>;
  const everywhere = repositories.map(({ name }) => name);
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div>
        <p className="text-xs text-muted">
          <Link href="/context/socles" className="link">
            Socles
          </Link>{' '}
          › {socle.name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Modifier le socle</h1>
      </div>
      <p className="text-muted md:hidden">Un socle se modifie depuis le poste.</p>
      <div className="hidden md:block">
        <SocleForm
          initial={socle}
          socles={socles}
          repositories={everywhere}
          busy={save.isPending}
          serverError={error}
          onCancel={() => router.back()}
          onSubmit={(change) => {
            setError(null);
            setPending(change);
          }}
        />
      </div>
      <SocleImpactDialog
        open={pending !== null}
        socle={socle.name}
        count={pending ? concernedRepositories(id, socles, pending, everywhere).length : 0}
        busy={save.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => pending && save.mutate(pending)}
      />
    </div>
  );
}
