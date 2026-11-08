import { DomainError } from '../../shared/domain/domain-error.ts';

/**
 * Session pilotée par Bosco (E2e à E2h, E16a, règle 4, DT-31) : Bosco la démarre ou la reprend et lui écrit. Un tour
 * par lancement de l'agent ; entre deux tours, la session est close et se reprend aussi dans un terminal.
 */

/** Mode d'autorisations choisi dans la barre d'outils : Demander, Accepter les modifications, Plan (CA-SESS-94). */
export type PermissionMode = 'acceptEdits' | 'ask' | 'plan';

export const PERMISSION_MODES: readonly PermissionMode[] = ['ask', 'acceptEdits', 'plan'];

/** Effort de l'agent ; null : celui du profil. */
export type Effort = 'high' | 'low' | 'max' | 'medium' | 'xhigh';

export const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

/** Réglages d'un tour : ils valent dès le message envoyé et pour les suivants (CA-SESS-94). */
export interface PilotSettings {
  effort: Effort | null;
  /** null : le modèle par défaut du profil */
  model: null | string;
  permissionMode: PermissionMode;
}

export const DEFAULT_PILOT_SETTINGS: PilotSettings = { effort: null, model: null, permissionMode: 'ask' };

/** Une image jointe, en base64, comme l'agent la reçoit. */
export interface PilotImage {
  data: string;
  mediaType: string;
  name: string;
}

/** Ce que la personne envoie : le texte (fichiers en `@chemin`, commande en tête), et les images jointes. */
export interface PilotMessage {
  images: PilotImage[];
  text: string;
}

/** Images jointes à un message, au plus (CA-SESS-92). */
export const MAX_IMAGES = 5;
/** Taille d'une image jointe, au plus : celle qu'accepte l'agent */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];

export class InvalidPilotMessage extends DomainError {
  constructor(message: string) {
    super('invalidPilotMessage', message);
  }
}

/** Un message vide, trop d'images, une image trop lourde ou d'un format que l'agent ne lit pas : refusé. */
export function checkPilotMessage(message: PilotMessage): PilotMessage {
  const text = message.text.trim();
  if (!text && message.images.length === 0) throw new InvalidPilotMessage('Écris un message ou joins une image.');
  if (message.images.length > MAX_IMAGES) throw new InvalidPilotMessage(`${MAX_IMAGES} images au plus par message.`);
  for (const image of message.images) {
    if (!IMAGE_TYPES.includes(image.mediaType))
      throw new InvalidPilotMessage(`${image.name} : seules les images PNG, JPEG, GIF et WebP sont acceptées.`);
    if ((image.data.length * 3) / 4 > MAX_IMAGE_BYTES)
      throw new InvalidPilotMessage(`${image.name} : 5 Mo au plus par image.`);
  }
  return { images: message.images, text };
}

/** Un second message envoyé pendant le tour rejoint le premier, qui attend la fin du tour (CA-SESS-93). */
export function joinMessages(pending: null | PilotMessage, next: PilotMessage): PilotMessage {
  if (!pending) return next;
  const images = [...pending.images, ...next.images];
  if (images.length > MAX_IMAGES) throw new InvalidPilotMessage(`${MAX_IMAGES} images au plus par message.`);
  return { images, text: [pending.text, next.text].filter(Boolean).join('\n\n') };
}

/** Une session encore ouverte dans un terminal ne reçoit rien de Bosco : on y répond dans le terminal (règle 9). */
export class SessionOpenInTerminal extends DomainError {
  constructor(sessionId: string) {
    super('sessionOpenInTerminal', `La session ${sessionId} est ouverte dans un terminal : réponds-y là-bas.`);
  }
}

/** Rien à arrêter, à annuler ou à qui répondre : aucun tour piloté ne tourne pour cette session. */
export class NoPilotedTurn extends DomainError {
  constructor(sessionId: string) {
    super('noPilotedTurn', `Aucun tour piloté par Bosco ne tourne pour la session ${sessionId}.`);
  }
}

/** Un dépôt, un profil ou une session que Bosco ne connaît pas, ou une session effacée par Claude Code. */
export class PilotTargetNotFound extends DomainError {
  constructor(message: string) {
    super('pilotTargetNotFound', message);
  }
}

/** Une question à choix posée par l'agent (AskUserQuestion), à répondre dans Bosco (E2f). */
export interface AgentQuestion {
  header: string;
  multiSelect: boolean;
  options: { description: string; label: string }[];
  question: string;
}

/** Lit les questions de l'outil AskUserQuestion ; [] si leur forme n'est pas celle attendue. */
export function questionsOf(input: unknown): AgentQuestion[] {
  const questions = (input as { questions?: unknown } | null)?.questions;
  if (!Array.isArray(questions)) return [];
  return questions.flatMap((raw: unknown) => {
    const { header, multiSelect, options, question } = (raw ?? {}) as Record<string, unknown>;
    if (typeof question !== 'string' || !Array.isArray(options)) return [];
    return [
      {
        header: typeof header === 'string' ? header : '',
        multiSelect: multiSelect === true,
        options: options.flatMap((option: unknown) => {
          const { description, label } = (option ?? {}) as Record<string, unknown>;
          return typeof label === 'string'
            ? [{ label, description: typeof description === 'string' ? description : '' }]
            : [];
        }),
        question,
      },
    ];
  });
}

export class InvalidAnswers extends DomainError {
  constructor(message: string) {
    super('invalidAnswers', message);
  }
}

/**
 * Réponses données dans Bosco, une par question dans l'ordre : les choix cochés, ou le texte de « Autre ». L'agent les
 * reçoit par question, plusieurs choix séparés par des virgules (CA-SESS-96).
 */
export function answersOf(questions: AgentQuestion[], answers: string[][]): Record<string, string> {
  if (answers.length !== questions.length) throw new InvalidAnswers('Une réponse par question.');
  return Object.fromEntries(
    questions.map((question, index) => {
      const chosen = (answers[index] ?? []).map((answer) => answer.trim()).filter(Boolean);
      if (chosen.length === 0) throw new InvalidAnswers(`Réponds à « ${question.question} ».`);
      if (!question.multiSelect && chosen.length > 1)
        throw new InvalidAnswers(`Un seul choix pour « ${question.question} ».`);
      return [question.question, chosen.join(', ')];
    }),
  );
}
