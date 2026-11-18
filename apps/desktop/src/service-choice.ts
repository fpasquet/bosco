// Un service Bosco répond déjà quand l'application s'ouvre : elle propose de s'y relier (par défaut) ou de le remplacer.
import type { MessageBoxOptions } from 'electron';

export type ServiceChoice = 'attach' | 'own' | 'quit';

/** Les boutons de la question, dans l'ordre : le premier est le choix par défaut, le dernier l'annulation */
const CHOICES = ['attach', 'own', 'quit'] as const satisfies readonly ServiceChoice[];

/** La question posée à la première ouverture, quand un service répond déjà sur cette adresse. */
export function serviceChoiceDialog(baseUrl: string): MessageBoxOptions {
  return {
    type: 'question',
    title: 'Bosco tourne déjà sur ce poste',
    message: 'Bosco tourne déjà sur ce poste',
    detail:
      `Un service Bosco répond sur ${baseUrl}. L'application peut s'en servir, ou le remplacer : ` +
      'ses sessions, ses tâches et ses réglages sont gardés.\n\n' +
      '• Se relier au service : l’application n’est qu’une fenêtre sur le service, qui continue de tourner sans elle, ' +
      'comme avant dans le navigateur.\n' +
      '• Remplacer le service : il s’arrête et ne démarre plus seul ; l’application fait tourner Bosco.',
    buttons: ['Se relier au service', 'Remplacer le service par l’application', 'Quitter'],
    defaultId: CHOICES.indexOf('attach'),
    cancelId: CHOICES.indexOf('quit'),
  };
}

/** Le bouton choisi ; une réponse inconnue quitte. */
export function choiceOf(response: number): ServiceChoice {
  return CHOICES[response] ?? 'quit';
}
