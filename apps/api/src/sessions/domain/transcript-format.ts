// Format des transcripts de Claude Code : interne, il change d'une version à l'autre. Quand Bosco ne sait plus lire
// les nouvelles sessions d'un profil, la source passe « À mettre à jour » et ses nouvelles sessions ne sont plus lues,
// jusqu'à ce que Bosco soit mis à jour (l'état ne survit pas à un redémarrage).

/** Lignes complètes d'un transcript à partir desquelles il est jugé : en deçà, rien n'est encore sûr */
export const JUDGED_LINES = 5;

/** Nouveaux transcripts illisibles d'affilée qui font passer la source « À mettre à jour » */
export const UNREADABLE_IN_A_ROW = 3;

/** Ce qu'a donné la lecture d'un transcript : ses lignes complètes, et celles dont le parseur a tiré un fait. */
export interface TranscriptReading {
  lines: number;
  read: number;
}

/** Jugement d'un transcript : lisible, illisible, ou trop court pour le dire. */
export function judgeTranscript({ lines, read }: TranscriptReading): 'readable' | 'unreadable' | 'unknown' {
  if (read > 0) return 'readable';
  return lines >= JUDGED_LINES ? 'unreadable' : 'unknown';
}

/** Sources dont Bosco ne sait plus lire le format : trois nouveaux transcripts illisibles d'affilée. */
export class TranscriptFormats {
  private readonly inARow = new Map<string, number>();
  private readonly outdated = new Set<string>();

  /** Note le jugement d'un transcript d'une source : un transcript lisible remet le compte à zéro. */
  note(sourceId: string, judgement: 'readable' | 'unreadable'): void {
    if (judgement === 'readable') {
      this.inARow.delete(sourceId);
      return;
    }
    const count = (this.inARow.get(sourceId) ?? 0) + 1;
    this.inARow.set(sourceId, count);
    if (count >= UNREADABLE_IN_A_ROW) this.outdated.add(sourceId);
  }

  /** La source est « À mettre à jour » : ses nouvelles sessions ne sont plus lues. */
  isOutdated(sourceId: string): boolean {
    return this.outdated.has(sourceId);
  }

  forget(): void {
    this.inARow.clear();
    this.outdated.clear();
  }
}
