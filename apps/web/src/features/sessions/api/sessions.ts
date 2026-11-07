import type { ImportProgressDto, SessionDto } from '@bosco/domain';

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
