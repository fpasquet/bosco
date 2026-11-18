/** Suffixe par lequel l'agent marque l'option qu'il recommande, en anglais ou en français. */
const RECOMMENDED = /\((?:recommended|recommandée?)\)$/i;

/**
 * Libellé d'une option de question tel qu'on l'affiche : sans le suffixe « (Recommended) » ou « (Recommandé) », que
 * remplace l'étiquette « Recommandé ». La réponse transmise garde le libellé d'origine.
 */
export function recommendedOf(label: string): { label: string; recommended: boolean } {
  const trimmed = label.trim();
  const suffix = RECOMMENDED.exec(trimmed);
  if (!suffix) return { label, recommended: false };
  return { label: trimmed.slice(0, suffix.index).trimEnd(), recommended: true };
}
