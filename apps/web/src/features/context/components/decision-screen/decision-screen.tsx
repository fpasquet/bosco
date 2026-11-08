'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DecisionDto, DecisionTargetDto, DecisionTextDto } from '@bosco/domain';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import {
  abandonDecision,
  acceptDecision,
  contextQuery,
  ContextRefused,
  decisionQuery,
  editDecision,
  refuseDecision,
  soclesQuery,
  writeDecision,
} from '../../api/context';
import { DecisionForm, type DecisionFormValues } from '../decision-form';
import { DecisionView } from '../decision-view';

function useTargetLabel(target: DecisionTargetDto | null) {
  const { data: socles } = useQuery({ ...soclesQuery, enabled: target?.kind === 'socle' });
  if (!target) return { label: '', parent: { href: '/context', label: 'Contexte' } };
  if (target.kind === 'repository')
    return {
      label: target.name,
      parent: { href: `/context?repository=${encodeURIComponent(target.name)}`, label: `Contexte › ${target.name}` },
    };
  const name = socles?.find(({ id }) => id === target.id)?.name ?? 'Socle';
  return { label: name, parent: { href: '/context/socles', label: 'Socles' } };
}

/** Une décision (E9b, E9d), tenue à jour après chaque action. */
export function DecisionScreen({ id }: { id: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data } = useQuery(decisionQuery(id));
  const { label, parent } = useTargetLabel(data?.decision.target ?? null);
  const done = async (decision: DecisionDto) => {
    await client.invalidateQueries();
    // Acceptée ou refusée : retour au contexte du dépôt, où le bandeau disparaît (CA-CONT-06)
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
        targetLabel={label}
        parent={parent}
        busy={accept.isPending || refuse.isPending || abandon.isPending}
        onAccept={(edited) => accept.mutate(edited)}
        onRefuse={(reason) => refuse.mutate(reason)}
        onAbandon={(reason) => abandon.mutate(reason)}
      />
    </div>
  );
}

/** Nouvelle décision (E9c) pour un dépôt ou un socle ; elle peut en remplacer une autre. */
export function NewDecisionScreen({ replaces, target }: { replaces: null | number; target: DecisionTargetDto }) {
  const router = useRouter();
  const client = useQueryClient();
  const { label, parent } = useTargetLabel(target);
  const repository = target.kind === 'repository' ? target.name : null;
  const { data: context } = useQuery({ ...contextQuery(repository ?? ''), enabled: repository !== null });
  const { data: replaced } = useQuery({ ...decisionQuery(replaces ?? 0), enabled: replaces !== null });
  const [error, setError] = useState<null | string>(null);
  const write = useMutation({
    mutationFn: ({ accept, exceptionTo, text }: DecisionFormValues) =>
      writeDecision({ target, text, accept, exceptionTo, replaces }),
    onSuccess: async () => {
      await client.invalidateQueries();
      router.push(parent.href);
    },
    onError: (failure) =>
      setError(failure instanceof ContextRefused ? failure.message : 'La décision n’a pas pu être enregistrée.'),
  });
  const choices = (context?.socles ?? []).flatMap(({ decisions }) => decisions);
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
            targetLabel={label}
            exceptionChoices={choices}
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

/** Nouvelle version d'une décision acceptée (E9e), avec sa note obligatoire. */
export function EditDecisionScreen({ id }: { id: number }) {
  const router = useRouter();
  const client = useQueryClient();
  const { data } = useQuery(decisionQuery(id));
  const { label } = useTargetLabel(data?.decision.target ?? null);
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
          targetLabel={label}
          exceptionChoices={[]}
          busy={edit.isPending}
          serverError={error}
          onCancel={() => router.back()}
          onSubmit={(values) => edit.mutate(values)}
        />
      </div>
    </div>
  );
}
