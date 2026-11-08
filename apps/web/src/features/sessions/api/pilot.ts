import type { PilotMessageDto, PilotOptionsDto, StartSessionDto, SuggestionDto } from '@bosco/domain';

/** Erreur de l'API de pilotage, avec le message à montrer (« La session … est ouverte dans un terminal »). */
export class PilotError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  noPilotedTurn: 'Aucun tour ne tourne pour cette session.',
  questionAlreadyAnswered: 'Cette question a déjà sa réponse.',
  sessionOpenInTerminal: 'Cette session est ouverte dans un terminal : réponds-y là-bas.',
};

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    headers: init.body ? { 'content-type': 'application/json' } : undefined,
  });
  if (response.ok) return response;
  const body = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  const code = body.code ?? 'error';
  throw new PilotError(code, MESSAGES[code] ?? body.message ?? `Bosco a répondu ${response.status}.`);
}

/** Formulaire d'une nouvelle session (E16a) : dépôts et abonnements Claude. */
export const pilotOptionsQuery = {
  queryKey: ['pilot', 'options'],
  queryFn: async (): Promise<PilotOptionsDto> => {
    const response = await call('/api/pilot/options');
    return (await response.json()) as PilotOptionsDto;
  },
};

/** « Démarrer la session » (CA-SESS-91) : l'identifiant de la session créée. */
export async function startSession(input: StartSessionDto): Promise<string> {
  const response = await call('/api/pilot/sessions', { method: 'POST', body: JSON.stringify(input) });
  const body = (await response.json()) as { sessionId: string };
  return body.sessionId;
}

/** Un message à une session : il part tout de suite, ou attend la fin du tour (CA-SESS-92, CA-SESS-93). */
export async function sendMessage(sessionId: string, message: PilotMessageDto): Promise<'channel' | 'queued' | 'sent'> {
  const response = await call(`/api/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(message),
  });
  const body = (await response.json()) as { status: 'channel' | 'queued' | 'sent' };
  return body.status;
}

export async function cancelPending(sessionId: string): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/messages/pending`, { method: 'DELETE' });
}

export async function interruptTurn(sessionId: string): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/interrupt`, { method: 'POST' });
}

/** Réponses à une question de l'agent, une liste de choix par question ; null pour « Passer » (CA-SESS-96). */
export async function answerQuestion(sessionId: string, requestId: string, answers: null | string[][]): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answers, requestId }),
  });
}

/** Où chercher les suggestions : une session, ou le dépôt et le profil d'une nouvelle session. */
export type SuggestionTarget = { profile: null | string; repository: string } | { sessionId: string };

/** Suggestions de « @ » et « / » (CA-SESS-99) ; [] si Bosco ne répond pas. */
export async function suggestions(
  target: SuggestionTarget,
  kind: 'command' | 'file',
  query: string,
): Promise<SuggestionDto[]> {
  const params = new URLSearchParams({ kind, q: query });
  if ('sessionId' in target) params.set('session', target.sessionId);
  else {
    params.set('repository', target.repository);
    if (target.profile) params.set('profile', target.profile);
  }
  try {
    const response = await call(`/api/pilot/suggestions?${params.toString()}`);
    const body = (await response.json()) as { suggestions: SuggestionDto[] };
    return body.suggestions;
  } catch {
    return [];
  }
}
