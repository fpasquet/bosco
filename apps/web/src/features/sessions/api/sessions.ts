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
