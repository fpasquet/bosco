import type { Editor } from '@tiptap/core';

export type SuggestionKind = 'command' | 'file';

/** Déclencheur de chaque menu : « @ » pour un fichier du dépôt, « / » en tête de message pour une commande. */
export const TRIGGER: Record<SuggestionKind, string> = { command: '/', file: '@' };

/** Texte d'une puce dans le message envoyé : `@chemin` ou `/nom`, sans doubler un déclencheur déjà présent. */
export function mentionText(char: string, value: string): string {
  return value.startsWith(char) ? value : `${char}${value}`;
}

/** Message en texte simple : puces en `@chemin` et `/nom`, paragraphes et sauts de ligne en `\n`, rogné. */
export function textOf(editor: Editor): string {
  return editor.getText({ blockSeparator: '\n' }).trim();
}
