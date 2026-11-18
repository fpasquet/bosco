import { describeToolCall } from 'ai-sdk-harness-approval';

/** Longueur au-delà de laquelle un texte de session est coupé : une ligne de tableau, pas un fil complet. */
export const TEXT_LIMIT = 280;

/** Texte sur une ligne, coupé à TEXT_LIMIT caractères. */
export function shorten(value: string): string {
  const single = value.replaceAll(/\s+/g, ' ').trim();
  return single.length > TEXT_LIMIT ? `${single.slice(0, TEXT_LIMIT - 1)}…` : single;
}

function textOf(value: unknown): null | string {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * Ce que l'agent veut faire, comme le montre la carte d'autorisation : la commande, le fichier ou l'adresse. Le paquet
 * lit la commande d'un outil de commande et les fichiers d'une modification ; pour le reste, il ne rend que l'entrée en
 * JSON, et Bosco garde ses champs (fichier lu, motif cherché, adresse).
 */
export function actionTargetOf(tool: string, input: unknown): null | string {
  const { detail, kind } = describeToolCall({ input, toolName: tool });
  if (kind === 'command' || kind === 'edit') return textOf(detail);
  const fields = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  return (
    textOf(fields.command) ??
    textOf(fields.file_path) ??
    textOf(fields.notebook_path) ??
    textOf(fields.pattern) ??
    textOf(fields.url)
  );
}

/** Ce que fait un outil, en une ligne : « Bash · npm run db:migrate », « Edit · src/logger/index.ts ». */
export function describeAction(tool: string, input: unknown): { detail: null | string; summary: string } {
  const detail = actionTargetOf(tool, input);
  return { detail: detail ? shorten(detail) : null, summary: shorten(detail ? `${tool} · ${detail}` : tool) };
}
