'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DecisionDto, DecisionTextDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import {
  abandonDecision,
  acceptDecision,
  ContextRefused,
  decisionQuery,
  editDecision,
  projectsQuery,
  refuseDecision,
  writeDecision,
} from '../../api/context';
import { DecisionForm, type DecisionFormValues } from '../decision-form';
import { DecisionView } from '../decision-view';

/** Onglet Contexte de la page d'un projet, et ses décisions. */
function placeOf(projectId: number) {
  const context = `/projects/${projectId}/context`;
  return { context, decisions: `${context}/decisions` };
}

/** Une décision, tenue à jour après chaque action ; sa place est sous le contexte de son projet. */
export function DecisionScreen({ id, projectId }: { id: number; projectId: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data } = useQuery(decisionQuery(id));
  const project = data?.decision.target.name ?? null;
  const place = placeOf(projectId);
  const done = async (decision: DecisionDto) => {
    await client.invalidateQueries();
    // Acceptée ou refusée : retour au contexte du projet, où le bandeau disparaît
    if (decision.state === 'accepted' || decision.state === 'refused') router.push(place.context);
  };
  const accept = useMutation({
    mutationFn: (edited: DecisionTextDto | null) => acceptDecision(id, edited),
    onSuccess: done,
  });
  const refuse = useMutation({ mutationFn: (reason: null | string) => refuseDecision(id, reason), onSuccess: done });
  const abandon = useMutation({ mutationFn: (reason: null | string) => abandonDecision(id, reason), onSuccess: done });
  if (!data) return <PageSkeleton variant="detail" rows={6} />;
  return (
    <div className="p-4 md:px-8 md:pt-6">
      <DecisionView
        detail={data}
        now={new Date()}
        targetLabel={project ?? ''}
        decisionsHref={place.decisions}
        busy={accept.isPending || refuse.isPending || abandon.isPending}
        onAccept={(edited) => accept.mutate(edited)}
        onRefuse={(reason) => refuse.mutate(reason)}
        onAbandon={(reason) => abandon.mutate(reason)}
      />
    </div>
  );
}

/** Nouvelle décision d'un projet, sous l'onglet Contexte de sa page ; elle peut en remplacer une autre. */
export function NewDecisionScreen({ projectId, replaces }: { projectId: number; replaces: null | number }) {
  const router = useRouter();
  const client = useQueryClient();
  const place = placeOf(projectId);
  const { data: replaced } = useQuery({ ...decisionQuery(replaces ?? 0), enabled: replaces !== null });
  // Une décision se porte sur n'importe quel projet connu, même sans décision encore
  const { data: known } = useQuery(projectsQuery);
  const project = known?.find(({ id }) => id === projectId)?.name ?? '';
  const retarget = (name: string) => {
    const target = known?.find((candidate) => candidate.name === name);
    if (!target) return;
    const query = replaces === null ? '' : `?replaces=${replaces}`;
    router.replace(`${placeOf(target.id).decisions}/new${query}`);
  };
  const [error, setError] = useState<null | string>(null);
  const write = useMutation({
    mutationFn: ({ accept, text }: DecisionFormValues) =>
      writeDecision({ target: { kind: 'project', name: project }, text, accept, replaces }),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push(place.context);
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'La décision n’a pas pu être enregistrée.'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div>
        <Breadcrumbs
          items={[
            { href: '/projects', label: 'Projets' },
            { href: place.context, label: project || 'Projet' },
            { label: replaces ? `Remplacer DEC-${replaces}` : 'Nouvelle décision' },
          ]}
        />
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {replaces ? `Remplacer DEC-${replaces}` : 'Nouvelle décision'}
        </h1>
      </div>
      <p className="text-muted md:hidden">Une décision s’écrit depuis le poste.</p>
      <div className="hidden max-w-3xl md:block">
        {(replaces === null || replaced) && project && (
          <DecisionForm
            mode="new"
            initial={replaced?.decision.versions.at(-1) ?? null}
            targetLabel={project}
            targetChoices={known?.map(({ name }) => name)}
            onTargetChange={retarget}
            busy={write.isPending}
            serverError={null}
            onCancel={() => router.back()}
            onSubmit={(values) => write.mutate(values)}
          />
        )}
        {error && <p className="mt-2 text-danger">{error}</p>}
      </div>
    </div>
  );
}

/** Nouvelle version d'une décision acceptée, avec sa note obligatoire. */
export function EditDecisionScreen({ id, projectId }: { id: number; projectId: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const place = placeOf(projectId);
  const { data } = useQuery(decisionQuery(id));
  const [error, setError] = useState<null | string>(null);
  const edit = useMutation({
    mutationFn: ({ note, text }: DecisionFormValues) => editDecision(id, text, note),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push(`${place.decisions}/${id}`);
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'La version n’a pas pu être enregistrée.'),
  });
  if (!data) return <PageSkeleton variant="form" rows={3} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div>
        <Breadcrumbs
          items={[
            { href: '/projects', label: 'Projets' },
            { href: place.context, label: data.decision.target.name },
            { href: `${place.decisions}/${id}`, label: `DEC-${id}` },
            { label: 'Modifier' },
          ]}
        />
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Modifier DEC-{id}</h1>
      </div>
      <p className="text-muted md:hidden">Une décision se modifie depuis le poste.</p>
      <div className="hidden max-w-3xl md:block">
        <DecisionForm
          mode="edit"
          initial={data.decision.versions.at(-1)!}
          nextVersion={data.decision.versions.length + 1}
          targetLabel={data.decision.target.name}
          busy={edit.isPending}
          serverError={error}
          onCancel={() => router.back()}
          onSubmit={(values) => edit.mutate(values)}
        />
      </div>
    </div>
  );
}
