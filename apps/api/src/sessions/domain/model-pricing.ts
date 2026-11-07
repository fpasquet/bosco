import type { TokenUsage } from './token-usage.ts';

/**
 * Tarifs publics des modèles, en dollars par million de tokens (référence Anthropic du 06/10/2026). Le coût d'une
 * session est une estimation à ces tarifs, même sous abonnement (RF-SESS-05). L'écriture du cache compte 1,25 fois
 * l'entrée (durée de 5 minutes, celle de Claude Code) ; la lecture, une fraction de l'entrée propre à chaque modèle.
 */
interface Price {
  cacheReadRatio: number;
  input: number;
  output: number;
}

const CACHE_WRITE_RATIO = 1.25;

const PRICES: Record<string, Price> = {
  'claude-fable-5-1': { input: 10, output: 50, cacheReadRatio: 0.025 },
  'claude-mythos-5-1': { input: 10, output: 50, cacheReadRatio: 0.025 },
  'claude-fable-5': { input: 10, output: 50, cacheReadRatio: 0.1 },
  'claude-opus-5-5': { input: 4, output: 20, cacheReadRatio: 0.05 },
  'claude-opus-5': { input: 5, output: 25, cacheReadRatio: 0.1 },
  'claude-opus-4-8': { input: 5, output: 25, cacheReadRatio: 0.1 },
  'claude-opus-4-7': { input: 5, output: 25, cacheReadRatio: 0.1 },
  'claude-opus-4-6': { input: 5, output: 25, cacheReadRatio: 0.1 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheReadRatio: 0.1 },
  'claude-sonnet-5': { input: 2, output: 10, cacheReadRatio: 0.1 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheReadRatio: 0.1 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheReadRatio: 0.1 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheReadRatio: 0.1 },
};

/** Coût estimé en micro-dollars, ou null pour un modèle dont le tarif n'est pas connu (« non chiffré »). */
export function estimateCostMicros(model: null | string, usage: TokenUsage): null | number {
  const price = model ? PRICES[model.replace(/-\d{8}$/, '')] : undefined;
  if (!price) return null;
  const dollarsPerMillion =
    usage.input * price.input +
    usage.output * price.output +
    usage.cacheCreation * price.input * CACHE_WRITE_RATIO +
    usage.cacheRead * price.input * price.cacheReadRatio;
  return Math.round(dollarsPerMillion);
}
