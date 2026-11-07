/** Fichier modifié par l'agent pendant la session, avec ses lignes ajoutées et retirées (E2a, colonne « Branche »). */
export interface FileChange {
  added: number;
  path: string;
  removed: number;
}

/** Au-delà, le calcul exact coûterait trop : on compte les lignes de part et d'autre. */
const LCS_LIMIT = 4_000_000;

function linesOf(text: string): string[] {
  return text === '' ? [] : text.replace(/\n$/, '').split('\n');
}

/** Lignes ajoutées et retirées d'un remplacement, d'après la plus longue suite de lignes communes. */
export function lineChanges(before: string, after: string): Pick<FileChange, 'added' | 'removed'> {
  const left = linesOf(before);
  const right = linesOf(after);
  if (left.length * right.length > LCS_LIMIT) return { added: right.length, removed: left.length };
  let previous = new Array<number>(right.length + 1).fill(0);
  for (const line of left) {
    const current = new Array<number>(right.length + 1).fill(0);
    for (const [index, other] of right.entries())
      current[index + 1] =
        line === other ? (previous[index] ?? 0) + 1 : Math.max(previous[index + 1] ?? 0, current[index] ?? 0);
    previous = current;
  }
  const common = previous[right.length] ?? 0;
  return { added: right.length - common, removed: left.length - common };
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Modification décrite par un appel d'outil de l'agent (Edit, MultiEdit, Write) ; null pour les autres outils. Les
 * changements faits par une commande shell n'y figurent pas (E2a, annotation 4).
 */
export function changeOf(tool: string, input: unknown): FileChange | null {
  if (typeof input !== 'object' || input === null) return null;
  const fields = input as Record<string, unknown>;
  const path = textOf(fields.file_path);
  if (!path) return null;
  if (tool === 'Write') return { path, added: linesOf(textOf(fields.content)).length, removed: 0 };
  if (tool === 'Edit') return { path, ...lineChanges(textOf(fields.old_string), textOf(fields.new_string)) };
  if (tool === 'MultiEdit' && Array.isArray(fields.edits)) {
    const total = { path, added: 0, removed: 0 };
    for (const edit of fields.edits as Record<string, unknown>[]) {
      const { added, removed } = lineChanges(textOf(edit.old_string), textOf(edit.new_string));
      total.added += added;
      total.removed += removed;
    }
    return total;
  }
  return null;
}

/** Cumul par fichier, dans l'ordre de la première modification. */
export function mergeChange(changes: readonly FileChange[], change: FileChange): FileChange[] {
  const known = changes.find((candidate) => candidate.path === change.path);
  if (!known) return [...changes, change];
  return changes.map((candidate) =>
    candidate.path === change.path
      ? { path: candidate.path, added: candidate.added + change.added, removed: candidate.removed + change.removed }
      : candidate,
  );
}
