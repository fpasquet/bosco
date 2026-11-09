import type { Presence } from '../../application/notification.service.ts';

/** Un onglet au premier plan le redit à cet intervalle ; au-delà, il ne l'est plus (fermé, en veille, caché). */
export const PRESENCE_MS = 30_000;

/** Onglet Bosco au premier plan sur le poste, d'après le dernier signal de l'interface (E15b). */
export class PresenceTracker implements Presence {
  private lastForegroundAt = 0;

  constructor(private readonly now: () => Date) {}

  report(foreground: boolean): void {
    this.lastForegroundAt = foreground ? this.now().getTime() : 0;
  }

  foreground(): boolean {
    return this.now().getTime() - this.lastForegroundAt < PRESENCE_MS;
  }
}
