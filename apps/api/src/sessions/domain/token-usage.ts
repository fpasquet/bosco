/** Tokens consommés par une session, cache compris : la base de l'estimation du coût. */
export class TokenUsage {
  static readonly ZERO = new TokenUsage(0, 0, 0, 0);

  constructor(
    readonly input: number,
    readonly output: number,
    readonly cacheCreation: number,
    readonly cacheRead: number,
  ) {
    for (const value of [input, output, cacheCreation, cacheRead]) {
      if (!Number.isInteger(value) || value < 0) throw new RangeError(`Invalid token count: ${value}`);
    }
  }

  get total(): number {
    return this.input + this.output + this.cacheCreation + this.cacheRead;
  }

  add(other: TokenUsage): TokenUsage {
    return new TokenUsage(
      this.input + other.input,
      this.output + other.output,
      this.cacheCreation + other.cacheCreation,
      this.cacheRead + other.cacheRead,
    );
  }

  /** Ce qui reste une fois une part retirée, jamais en dessous de zéro. */
  minus(other: TokenUsage): TokenUsage {
    return new TokenUsage(
      Math.max(0, this.input - other.input),
      Math.max(0, this.output - other.output),
      Math.max(0, this.cacheCreation - other.cacheCreation),
      Math.max(0, this.cacheRead - other.cacheRead),
    );
  }
}
