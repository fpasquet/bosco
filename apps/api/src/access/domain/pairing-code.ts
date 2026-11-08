/** Code d'appairage d'un téléphone (E4c) : 6 chiffres, valable 5 minutes, à usage unique, 5 essais au plus (NF-14). */
export const PAIRING_CODE = { attempts: 5, lifetimeMs: 5 * 60 * 1000 } as const;

export type ClaimResult = 'accepted' | 'exhausted' | 'expired' | 'wrong';

export class PairingCode {
  private attemptsLeft: number = PAIRING_CODE.attempts;
  private used = false;

  constructor(
    readonly value: string,
    readonly expiresAt: Date,
  ) {}

  static issue(value: string, now: Date): PairingCode {
    return new PairingCode(value, new Date(now.getTime() + PAIRING_CODE.lifetimeMs));
  }

  /** Un essai : un code expiré, déjà servi ou dont les essais sont épuisés est refusé (CA-SESS-67). */
  claim(candidate: string, now: Date): ClaimResult {
    if (this.used || this.attemptsLeft <= 0) return 'exhausted';
    if (now >= this.expiresAt) return 'expired';
    if (candidate.replaceAll(/\s/g, '') !== this.value) {
      this.attemptsLeft -= 1;
      return this.attemptsLeft <= 0 ? 'exhausted' : 'wrong';
    }
    this.used = true;
    return 'accepted';
  }

  get remainingAttempts(): number {
    return this.attemptsLeft;
  }
}
