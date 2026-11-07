import type { DecisionText } from './decision.ts';

/** Sections d'une décision proposée par fichier, dans l'ordre où l'agent les écrit. */
const SECTIONS: Record<string, keyof DecisionText> = {
  contexte: 'context',
  décision: 'decision',
  decision: 'decision',
  conséquences: 'consequences',
  consequences: 'consequences',
  'alternatives écartées': 'alternatives',
  alternatives: 'alternatives',
};

/** Consigne donnée à l'agent du worker pour proposer une décision : un fichier, relevé à la fin de la tâche. */
export const PROPOSAL_HELP = [
  'Si ton travail suppose une décision durable pour ce dépôt (convention, choix technique), propose-la : écris un',
  'fichier .bosco/decisions/<nom>.md avec un titre (« # … ») puis les sections « ## Contexte », « ## Décision »,',
  '« ## Conséquences » et « ## Alternatives écartées ». Elle attendra la validation de la personne.',
].join(' ');

/** Décision proposée par un agent dans un fichier Markdown ; null s'il manque le titre, le contexte ou la décision. */
export function parseProposal(markdown: string): DecisionText | null {
  let title = '';
  let current: keyof DecisionText | null = null;
  const parts = new Map<keyof DecisionText, string[]>();
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) current = SECTIONS[line.slice(3).trim().toLowerCase()] ?? null;
    else if (line.startsWith('# ') && !title) {
      title = line.slice(2).trim();
      current = null;
    } else if (current) parts.set(current, [...(parts.get(current) ?? []), line]);
  }
  const section = (field: keyof DecisionText) => parts.get(field)?.join('\n').trim() || null;
  const context = section('context');
  const decision = section('decision');
  if (!title || !context || !decision) return null;
  return { title, context, decision, consequences: section('consequences'), alternatives: section('alternatives') };
}
