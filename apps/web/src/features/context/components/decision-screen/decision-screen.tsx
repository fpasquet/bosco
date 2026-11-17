'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DecisionDto, DecisionTextDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
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

/** Retour au contexte du projet de la décision. */
function parentOf(project: null | string) {
  if (project === null) return { href: '/context', label: 'Contexte' };
  return { href: `/context?project=${encodeURIComponent(project)}`, label: `Contexte › ${project}` };
}

/** Une décision, tenue à jour après chaque action. */
export function DecisionScreen({ id }: { id: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data } = useQuery(decisionQuery(id));
  const project = data?.decision.target.name ?? null;
  const parent = parentOf(project);
  const done = async (decision: DecisionDto) => {
    await client.invalidateQueries();
    // Acceptée ou refusée : retour au contexte du projet, où le bandeau disparaît
    if (decision.state === 'accepted' || decision.state === 'refused') router.push(parent.href);
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
        parent={parent}
        busy={accept.isPending || refuse.isPending || abandon.isPending}
        onAccept={(edited) => accept.mutate(edited)}
        onRefuse={(reason) => refuse.mutate(reason)}
        onAbandon={(reason) => abandon.mutate(reason)}
      />
    </div>
  );
}

/** Nouvelle décision d'un projet ; elle peut en remplacer une autre. */
export function NewDecisionScreen({ project, replaces }: { project: string; replaces: null | number }) {
  const router = useRouter();
  const client = useQueryClient();
  const parent = parentOf(project);
  const { data: replaced } = useQuery({ ...decisionQuery(replaces ?? 0), enabled: replaces !== null });
  // Une décision se porte sur n'importe quel projet connu, même sans décision encore
  const { data: known } = useQuery(projectsQuery);
  const retarget = (name: string) => {
    const query = new URLSearchParams({ project: name });
    if (replaces !== null) query.set('replaces', String(replaces));
    router.replace(`/context/decisions/new?${query.toString()}`);
  };
  const [error, setError] = useState<null | string>(null);
  const write = useMutation({
    mutationFn: ({ accept, text }: DecisionFormValues) =>
      writeDecision({ target: { kind: 'project', name: project }, text, accept, replaces }),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push(parent.href);
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'La décision n’a pas pu être enregistrée.'),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <div>
        <p className="text-xs text-muted">{parent.label}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {replaces ? `Remplacer DEC-${replaces}` : 'Nouvelle décision'}
        </h1>
      </div>
      <p className="text-muted md:hidden">Une décision s’écrit depuis le poste.</p>
      <div className="hidden max-w-3xl md:block">
        {(replaces === null || replaced) && (
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
export function EditDecisionScreen({ id }: { id: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data } = useQuery(decisionQuery(id));
  const [error, setError] = useState<null | string>(null);
  const edit = useMutation({
    mutationFn: ({ note, text }: DecisionFormValues) => editDecision(id, text, note),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push(`/context/decisions/${id}`);
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'La version n’a pas pu être enregistrée.'),
  });
  if (!data) return <PageSkeleton variant="form" rows={3} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Modifier DEC-{id}</h1>
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
