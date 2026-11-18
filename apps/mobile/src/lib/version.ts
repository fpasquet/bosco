// Version de l'application Android, celle du dépôt écrite dans app.json par le workflow Release. La page la lit dans
// l'agent utilisateur (« BoscoAndroid/0.3.0 ») et l'affiche dans Réglages › À propos.
import app from '../../app.json';

export const APP_VERSION: string = app.expo.version;

/** Ce que l'application ajoute à l'agent utilisateur de la vue web. */
export function userAgentName(version: string): string {
  return `BoscoAndroid/${version}`;
}
