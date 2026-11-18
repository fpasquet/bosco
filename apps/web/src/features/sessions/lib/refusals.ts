import type { ConversationPartDto, ConversationTurnDto } from '@bosco/domain';

/** Sortie réseau refusée telle que le proxy du bac à sable la note. */
export interface Refusal {
  at: string;
  host: string;
}

/** Une ligne du fil : les refus d'un domaine pendant un tour, à l'heure du premier. */
export interface RefusalLine extends Refusal {
  count: number;
}

const time = (at: string) => Date.parse(at);

/** Refus d'un même domaine réunis en une ligne, à l'heure du premier, dans l'ordre des heures. */
export function groupRefusals(refusals: readonly Refusal[]): RefusalLine[] {
  const lines = new Map<string, RefusalLine>();
  for (const refusal of [...refusals].sort((a, b) => time(a.at) - time(b.at))) {
    const line = lines.get(refusal.host);
    if (line) line.count += 1;
    else lines.set(refusal.host, { ...refusal, count: 1 });
  }
  return [...lines.values()];
}

/** Tour de l'agent d'un refus : celui en cours à son heure, ou la réponse à la demande en cours ; aucun avant le fil. */
function ownerOf(turns: readonly ConversationTurnDto[], refusal: Refusal): ConversationTurnDto | undefined {
  const started = turns.findLastIndex((turn) => time(turn.at) <= time(refusal.at));
  if (started < 0) return undefined;
  if (turns[started]?.role === 'assistant') return turns[started];
  return turns.slice(started + 1).find((turn) => turn.role === 'assistant');
}

/**
 * Range chaque refus dans le tour de l'agent pendant lequel il a eu lieu : le dernier tour commencé avant lui, ou
 * le tour qui répond à ta demande s'il tombe entre la demande et la réponse. Ce qui ne tombe dans aucun tour de
 * l'agent (fil pas encore lu, refus avant toute réponse) reste à part, pour la fin du fil.
 */
export function placeRefusals(
  turns: readonly ConversationTurnDto[],
  refusals: readonly Refusal[],
): { byTurn: Map<string, RefusalLine[]>; rest: RefusalLine[] } {
  const owned = new Map<string, Refusal[]>();
  const rest: Refusal[] = [];
  for (const refusal of refusals) {
    const owner = ownerOf(turns, refusal);
    if (owner) owned.set(owner.id, [...(owned.get(owner.id) ?? []), refusal]);
    else rest.push(refusal);
  }
  const byTurn = new Map([...owned].map(([id, list]) => [id, groupRefusals(list)]));
  return { byTurn, rest: groupRefusals(rest) };
}

/**
 * Découpe les parties d'un tour aux heures de ses refus : chaque ligne de refus vient après les parties qui l'ont
 * précédée, à l'endroit où l'agent a tenté la sortie.
 */
export function splitAtRefusals(
  parts: readonly ConversationPartDto[],
  lines: readonly RefusalLine[],
): { parts: ConversationPartDto[]; refusal: null | RefusalLine }[] {
  const segments: { parts: ConversationPartDto[]; refusal: null | RefusalLine }[] = [];
  let next = 0;
  for (const line of lines) {
    const end = parts.findIndex((part, index) => index >= next && time(part.at) > time(line.at));
    const stop = end < 0 ? parts.length : end;
    segments.push({ parts: parts.slice(next, stop), refusal: line });
    next = stop;
  }
  segments.push({ parts: parts.slice(next), refusal: null });
  return segments.filter((segment) => segment.parts.length > 0 || segment.refusal);
}
