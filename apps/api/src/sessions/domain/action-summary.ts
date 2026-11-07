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

/** Ce que fait un outil, en une ligne : « Bash · npm run db:migrate », « Edit · src/logger/index.ts ». */
export function describeAction(tool: string, input: unknown): { detail: null | string; summary: string } {
  const fields = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
  const detail = textOf(fields.command) ?? textOf(fields.file_path) ?? textOf(fields.pattern) ?? textOf(fields.url);
  return { detail: detail ? shorten(detail) : null, summary: shorten(detail ? `${tool} · ${detail}` : tool) };
}
