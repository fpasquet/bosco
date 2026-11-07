/** Tokens consommés par une session, cache compris : la base de l'estimation du coût (RF-SESS-05). */
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
}
