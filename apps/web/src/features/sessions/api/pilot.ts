import type {
  ContainersDto,
  IsolationDto,
  PilotMessageDto,
  PilotOptionsDto,
  ProjectDetailDto,
  RetrievedBranchesDto,
  SandboxBranchesDto,
  SandboxRefusalsDto,
  SessionDefaultsResolvedDto,
  StartSessionDto,
  SuggestionDto,
  UsageDto,
} from '@bosco/domain';

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
  sandboxBusy: 'Un tour est en cours : attends qu’il finisse.',
  sandboxRemoved: 'Ce bac à sable a été supprimé : la session ne se reprend plus.',
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

/** Formulaire d'une nouvelle session : projets et abonnements Claude. */
export const pilotOptionsQuery = {
  queryKey: ['pilot', 'options'],
  queryFn: async (): Promise<PilotOptionsDto> => {
    const response = await call('/api/pilot/options');
    return (await response.json()) as PilotOptionsDto;
  },
};

/** Ce qui décide des valeurs d'une nouvelle session : projet principal, groupe, profil choisi, bac à sable. */
export interface DefaultsTarget {
  group: null | number;
  profile: null | string;
  project: null | string;
  sandbox: boolean;
}

/** Valeurs d'une nouvelle session avant tout choix, chacune avec son origine. */
export function pilotDefaultsQuery(target: DefaultsTarget) {
  return {
    queryKey: ['pilot', 'defaults', target],
    queryFn: async (): Promise<SessionDefaultsResolvedDto> => {
      const params = new URLSearchParams();
      if (target.project) params.set('project', target.project);
      if (target.group !== null) params.set('group', String(target.group));
      if (target.profile) params.set('profile', target.profile);
      if (target.sandbox) params.set('sandbox', 'true');
      const response = await call(`/api/pilot/defaults?${params.toString()}`);
      return (await response.json()) as SessionDefaultsResolvedDto;
    },
  };
}

/** « Démarrer la session » : l'identifiant de la session créée. */
export async function startSession(input: StartSessionDto): Promise<string> {
  const response = await call('/api/pilot/sessions', { method: 'POST', body: JSON.stringify(input) });
  const body = (await response.json()) as { sessionId: string };
  return body.sessionId;
}

/** Un message à une session : il part tout de suite, ou attend la fin du tour. */
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

/** Réponses à une question de l'agent, une liste de choix par question ; null pour « Passer ». */
export async function answerQuestion(sessionId: string, requestId: string, answers: null | string[][]): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answers, requestId }),
  });
}

/** Où chercher les suggestions : une session, ou le projet et le profil d'une nouvelle session. */
export type SuggestionTarget = { profile: null | string; project: string } | { sessionId: string };

/** Suggestions de « @ » et « / » ; [] si Bosco ne répond pas. */
export async function suggestions(
  target: SuggestionTarget,
  kind: 'command' | 'file',
  query: string,
): Promise<SuggestionDto[]> {
  const params = new URLSearchParams({ kind, q: query });
  if ('sessionId' in target) params.set('session', target.sessionId);
  else {
    params.set('project', target.project);
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

/**
 * « Récupérer la branche », « Récupérer les branches » : un projet (sa racine), ou toutes
 * les branches qui ont du travail ; les branches reçues dans les dépôts du poste.
 */
export async function retrieveBranches(
  sessionId: string,
  project: null | string = null,
): Promise<RetrievedBranchesDto> {
  const response = await call(`/api/sessions/${encodeURIComponent(sessionId)}/sandbox/retrieve`, {
    method: 'POST',
    body: JSON.stringify({ project }),
  });
  return (await response.json()) as RetrievedBranchesDto;
}

/** Branches d'un bac à sable, une par projet, avec les fichiers qu'elles ont changés. */
export const sandboxBranchesQuery = (sessionId: string) => ({
  queryKey: ['session', sessionId, 'branches'],
  queryFn: async (): Promise<SandboxBranchesDto> => {
    const response = await call(`/api/sessions/${encodeURIComponent(sessionId)}/sandbox/branches`);
    return (await response.json()) as SandboxBranchesDto;
  },
});

/** Domaines autorisés de la liste générale du bac à sable : le récapitulatif les compte avec ceux des projets. */
export const isolationQuery = {
  queryKey: ['isolation'],
  queryFn: async (): Promise<IsolationDto> => {
    const response = await call('/api/isolation');
    return (await response.json()) as IsolationDto;
  },
};

/** « Arrêter le bac à sable » : le conteneur s'arrête, la copie reste. */
export async function stopSandbox(sessionId: string): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/sandbox/stop`, { method: 'POST' });
}

/** « Supprimer le bac à sable ». */
export async function removeSandbox(sessionId: string): Promise<void> {
  await call(`/api/sessions/${encodeURIComponent(sessionId)}/sandbox`, { method: 'DELETE' });
}

/** Sorties réseau refusées d'un bac à sable. */
export const sandboxRefusalsQuery = (sessionId: string) => ({
  queryKey: ['session', sessionId, 'refusals'],
  queryFn: async (): Promise<SandboxRefusalsDto> => {
    const response = await call(`/api/sessions/${encodeURIComponent(sessionId)}/sandbox/refusals`);
    return (await response.json()) as SandboxRefusalsDto;
  },
});

/** Mesure toutes les 5 s des conteneurs en cours, que la carte du bac à sable relit. */
const USAGE_REFRESH_MS = 5000;

/**
 * Consommation du conteneur d'un bac à sable démarré, lue dans les conteneurs en cours (même cache que leur panneau) ;
 * null s'il n'y figure pas.
 */
export const sandboxUsageQuery = (sessionId: string) => ({
  queryKey: ['containers'],
  queryFn: async (): Promise<ContainersDto> => {
    const response = await call('/api/containers');
    return (await response.json()) as ContainersDto;
  },
  select: (view: ContainersDto): null | UsageDto => {
    const sandbox = view.sandboxes.find((running) => running.sessionId === sessionId);
    return sandbox
      ? { cpu: sandbox.cpu, cpuLimit: sandbox.cpuLimit, memory: sandbox.memory, memoryLimit: sandbox.memoryLimit }
      : null;
  },
  refetchInterval: USAGE_REFRESH_MS,
});

/** Un projet, pour la branche courante de son dossier (carte « Projets » d'une session à plusieurs projets). */
export const projectDetailQuery = (id: number) => ({
  queryKey: ['projects', 'detail', id],
  queryFn: async (): Promise<ProjectDetailDto> => {
    const response = await call(`/api/projects/${id}`);
    return (await response.json()) as ProjectDetailDto;
  },
});
