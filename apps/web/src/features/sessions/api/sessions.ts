import type { ImportProgressDto, SessionConversationDto, SessionDetailDto, SessionDto } from '@bosco/domain';

/** Sessions connues ; le flux en direct (GET /api/events) tient ce cache à jour après le premier chargement. */
export const sessionsQuery = {
  queryKey: ['sessions'],
  queryFn: async (): Promise<SessionDto[]> => {
    const response = await fetch('/api/sessions');
    if (!response.ok) throw new Error(`GET /api/sessions answered ${response.status}`);
    return ((await response.json()) as { sessions: SessionDto[] }).sessions;
  },
  staleTime: Number.POSITIVE_INFINITY,
};

/** Avancement de la première lecture de l'historique, porté par le seul flux en direct ; null hors lecture. */
export const importProgressQuery = {
  queryKey: ['import-progress'],
  queryFn: (): ImportProgressDto | null => null,
  initialData: null,
  staleTime: Number.POSITIVE_INFINITY,
};

export type PermissionAnswerDto = { behavior: 'allow' } | { behavior: 'deny'; reason: null | string };

/** Réponse à une autorisation ; false quand le terminal a répondu le premier (409, la première réponse l'emporte). */
export async function answerPermission(
  sessionId: string,
  requestId: string,
  answer: PermissionAnswerDto,
): Promise<boolean> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/permission`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...answer, requestId }),
  });
  if (response.status === 409) return false;
  if (!response.ok) throw new Error(`POST /api/sessions/${sessionId}/permission answered ${response.status}`);
  return true;
}

/** Détail d'une session (E2) : le flux en direct l'invalide à chaque changement de la session. */
export const sessionDetailQuery = (id: string) => ({
  queryKey: ['session', id],
  queryFn: async (): Promise<SessionDetailDto> => {
    const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`GET /api/sessions/${id} answered ${response.status}`);
    return (await response.json()) as SessionDetailDto;
  },
});

/**
 * Fil complet d'une session, lu dans son transcript ; null quand le transcript n'existe plus (le fil se rabat sur le
 * journal). Sa clé commence par celle du détail : le flux en direct l'invalide avec lui.
 */
export const sessionConversationQuery = (id: string) => ({
  queryKey: ['session', id, 'conversation'],
  queryFn: async (): Promise<null | SessionConversationDto> => {
    const response = await fetch(`/api/sessions/${encodeURIComponent(id)}/conversation`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`GET /api/sessions/${id}/conversation answered ${response.status}`);
    return (await response.json()) as SessionConversationDto;
  },
  retry: false,
});
