// Ce qu'aucun scénario n'atteint, faute de fenêtre Electron : la question posée à la première ouverture à côté d'un
// service qui tourne déjà, son choix par défaut, et le choix gardé pour les ouvertures suivantes (CA-APPS-04).
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPreferences, savePreferences } from './preferences.ts';
import { choiceOf, serviceChoiceDialog } from './service-choice.ts';

describe('the first opening next to a running service', () => {
  it('CA-APPS-04 · offers to attach to the service by default, or to replace it, and keeps the choice', () => {
    const userData = mkdtempSync(join(tmpdir(), 'bosco-preferences-'));
    // Première ouverture : aucun choix gardé, l'application pose la question
    expect(loadPreferences(userData).service).toBeNull();

    const dialog = serviceChoiceDialog('http://127.0.0.1:4870');
    expect(dialog.buttons).toEqual(['Se relier au service', 'Remplacer le service par l’application', 'Quitter']);
    expect(choiceOf(dialog.defaultId ?? -1)).toBe('attach');
    expect(choiceOf(dialog.cancelId ?? -1)).toBe('quit');
    expect(dialog.detail).toContain('Un service Bosco répond sur http://127.0.0.1:4870.');
    expect(dialog.detail).toContain(
      'l’application n’est qu’une fenêtre sur le service, qui continue de tourner sans elle, comme avant dans le navigateur',
    );
    expect([choiceOf(0), choiceOf(1), choiceOf(2), choiceOf(7)]).toEqual(['attach', 'own', 'quit', 'quit']);

    // Le choix est gardé : la question n'est plus posée aux ouvertures suivantes
    savePreferences(userData, { service: 'attach' });
    expect(loadPreferences(userData).service).toBe('attach');
  });
});
