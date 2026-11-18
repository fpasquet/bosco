import { DomainError } from '../../shared/domain/domain-error.ts';

/** Mot à écrire pour confirmer la réinitialisation : un clic par erreur ne suffit pas à tout effacer. */
export const RESET_WORD = 'RÉINITIALISER';

export class ResetNotConfirmed extends DomainError {
  constructor() {
    super('resetNotConfirmed', `Type ${RESET_WORD} to confirm the reset`);
  }
}

/** Le mot sans majuscules ni accents : « reinitialiser » vaut « RÉINITIALISER ». */
function normalized(word: string): string {
  return word
    .trim()
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** La réinitialisation ne part que sur le mot, sans tenir compte des majuscules, des accents ni des espaces autour. */
export function checkResetWord(word: string): void {
  if (normalized(word) !== normalized(RESET_WORD)) throw new ResetNotConfirmed();
}
