const FENCE = /^(?:```|~~~)/;

/**
 * Un retour à la ligne simple devient un saut de ligne Markdown (deux espaces en fin de ligne), sauf dans un bloc de
 * code, qui garde ses lignes tel quel.
 */
export function withLineBreaks(text: string): string {
  let inCode = false;
  const lines = text.split('\n');
  return lines
    .map((line, index) => {
      if (FENCE.test(line.trimStart())) {
        inCode = !inCode;
        return line;
      }
      const next = lines[index + 1];
      const breaks = !inCode && line.trim() !== '' && next !== undefined && next.trim() !== '';
      return breaks && !FENCE.test(next.trimStart()) ? `${line}  ` : line;
    })
    .join('\n');
}
