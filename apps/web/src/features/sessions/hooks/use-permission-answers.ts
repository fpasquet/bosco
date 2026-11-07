'use client';
import { useState } from 'react';
import type { SessionDto } from '@bosco/domain';
import { answerPermission, type PermissionAnswerDto } from '../api/sessions';
import { titleOf } from '../components/sessions-table';
import { useNotices } from '../lib/notices';

type Dialog = { mode: 'allow' | 'deny'; session: SessionDto } | null;

/** Téléphone : « Autoriser » demande une confirmation rappelant la commande (RF-SESS-07, CA-SESS-37). */
const onPhone = () => globalThis.matchMedia?.('(max-width: 767px)').matches ?? false;

/**
 * Réponses aux autorisations depuis Bosco : « Refuser » demande d'abord un motif facultatif, « Autoriser » part
 * aussitôt sur le poste. Si le terminal a répondu le premier, un message le dit (la première réponse l'emporte).
 */
export function usePermissionAnswers() {
  const [busyId, setBusyId] = useState<null | string>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const push = useNotices((state) => state.push);

  const send = async (session: SessionDto, answer: PermissionAnswerDto) => {
    if (session.waiting?.kind !== 'permission') return;
    setBusyId(session.id);
    try {
      const accepted = await answerPermission(session.id, session.waiting.requestId, answer);
      if (!accepted) push(`Déjà répondu dans le terminal · ${titleOf(session)}`, 'warning');
    } catch {
      push(`La réponse n’a pas pu partir · ${titleOf(session)}`, 'warning');
    } finally {
      setBusyId(null);
    }
  };

  return {
    busyId,
    dialog,
    onAllow: (session: SessionDto) => {
      if (onPhone()) setDialog({ mode: 'allow', session });
      else void send(session, { behavior: 'allow' });
    },
    onDeny: (session: SessionDto) => setDialog({ mode: 'deny', session }),
    cancel: () => setDialog(null),
    confirm: (reason: null | string) => {
      if (!dialog) return;
      setDialog(null);
      void send(dialog.session, dialog.mode === 'allow' ? { behavior: 'allow' } : { behavior: 'deny', reason });
    },
  };
}
