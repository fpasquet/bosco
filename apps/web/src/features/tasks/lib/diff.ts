/** Une ligne de diff : ajoutée, retirée, de contexte, ou un en-tête de bloc. */
export interface DiffLine {
  kind: 'added' | 'context' | 'hunk' | 'removed';
  text: string;
}

export interface DiffFile {
  lines: DiffLine[];
  path: string;
}

/** Diff unifié de git, découpé par fichier ; les en-têtes de fichier ne sont pas gardés. */
export function parseDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = { path: line.split(' b/').at(-1) ?? line, lines: [] };
      files.push(current);
    } else if (
      !current ||
      /^(index |--- |\+\+\+ |new file|deleted file|similarity|rename |old mode|new mode)/.test(line)
    )
      continue;
    else if (line.startsWith('@@')) current.lines.push({ kind: 'hunk', text: line });
    else if (line.startsWith('+')) current.lines.push({ kind: 'added', text: line.slice(1) });
    else if (line.startsWith('-')) current.lines.push({ kind: 'removed', text: line.slice(1) });
    else if (line.startsWith(' ')) current.lines.push({ kind: 'context', text: line.slice(1) });
  }
  return files;
}
