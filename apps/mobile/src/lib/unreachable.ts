// Poste injoignable : ce que l'écran dit, l'heure de la dernière mise à jour, et le décompte de la prochaine tentative.

/** L'application réessaie toute seule à ce rythme */
export const RETRY_S = 5;

export function unreachableText(
  url: string,
  lastUpdate: null | string,
): Readonly<{ change: string; hint: string; retry: string; title: string }> {
  return {
    title: 'Bosco n’est pas joignable',
    hint:
      `Le téléphone doit être sur le même réseau que le poste (${url}).` +
      (lastUpdate ? ` Dernière mise à jour à ${lastUpdate}.` : ''),
    retry: 'Réessayer',
    change: 'Changer de poste',
  };
}

/** Une seconde de plus : le décompte descend, et repart après une tentative. */
export function countdown(left: number): Readonly<{ left: number; retry: boolean }> {
  return left > 1 ? { left: left - 1, retry: false } : { left: RETRY_S, retry: true };
}

/** Heure de la dernière page chargée (« 15:14 ») */
export function updateTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
