'use client';
import { useState } from 'react';
import type { SessionDto } from '@bosco/domain';
import { answerPermission, type PermissionAnswerDto } from '../api/sessions';
import { titleOf } from '../components/sessions-table';
import { useNotices } from '../lib/notices';

/** Téléphone : « Autoriser » demande une confirmation rappelant la commande (RF-SESS-07, CA-SESS-37). */
const onPhone = () => globalThis.matchMedia?.('(max-width: 767px)').matches ?? false;

/**
 * Réponses aux autorisations depuis Bosco : « Autoriser » part aussitôt sur le poste, après confirmation sur
 * téléphone ; un refus part avec son motif depuis la carte du détail (E2b). Si le terminal a répondu le premier, un
 * message le dit : la première réponse l'emporte.
 */
export function usePermissionAnswers({ onAnswered }: { onAnswered?: (session: SessionDto) => void } = {}) {
  const [busyId, setBusyId] = useState<null | string>(null);
  const [confirming, setConfirming] = useState<null | SessionDto>(null);
  const push = useNotices((state) => state.push);

  const send = async (session: SessionDto, answer: PermissionAnswerDto) => {
    if (session.waiting?.kind !== 'permission') return;
    setBusyId(session.id);
    try {
      const accepted = await answerPermission(session.id, session.waiting.requestId, answer);
      if (accepted) onAnswered?.(session);
      else push(`Déjà répondu dans le terminal · ${titleOf(session)}`, 'warning');
    } catch {
      push(`La réponse n’a pas pu partir · ${titleOf(session)}`, 'warning');
    } finally {
      setBusyId(null);
    }
  };

  return {
    busyId,
    confirming,
    onAllow: (session: SessionDto) => {
      if (onPhone()) setConfirming(session);
      else void send(session, { behavior: 'allow' });
    },
    deny: (session: SessionDto, reason: null | string) => void send(session, { behavior: 'deny', reason }),
    cancel: () => setConfirming(null),
    confirm: () => {
      if (!confirming) return;
      setConfirming(null);
      void send(confirming, { behavior: 'allow' });
    },
  };
}
