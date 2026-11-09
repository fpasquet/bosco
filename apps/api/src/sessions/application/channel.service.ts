import type { SessionEvents, SessionRepository } from './ports.ts';
import type { SessionService } from './session.service.ts';

/** Un serveur du canal de Bosco connecté pour une session du terminal : il pousse les messages dans la session. */
export type ChannelListener = (text: string) => void;

/** Installation du canal de Bosco dans un profil Claude Code (E4f). */
export interface ChannelInstaller {
  install(profilePath: string): Promise<void>;
  /** Commande qui lance une session du profil avec le canal */
  launchCommand(profilePath: string): string;
  isInstalled(profilePath: string): Promise<boolean>;
  uninstall(profilePath: string): Promise<void>;
}

/**
 * Canal de Bosco (E2i, règle 9) : chaque session du terminal lancée avec le canal s'y connecte ; un message écrit dans
 * Bosco lui est poussé, et arrive dans son terminal comme une saisie.
 */
export class ChannelService {
  private readonly channels = new Map<string, Set<ChannelListener>>();

  constructor(
    private readonly sessionRepository: Pick<SessionRepository, 'find'>,
    private readonly sessions: Pick<SessionService, 'viewOf'>,
    private readonly events: Pick<SessionEvents, 'sessionChanged'>,
  ) {}

  /** La session a son canal ouvert : Bosco peut lui écrire (CA-SESS-101). */
  isConnected(sessionId: string): boolean {
    return (this.channels.get(sessionId)?.size ?? 0) > 0;
  }

  /** Un serveur du canal se connecte pour sa session ; la fonction rendue le déconnecte. */
  connect(sessionId: string, listener: ChannelListener): () => void {
    const listeners = this.channels.get(sessionId) ?? new Set<ChannelListener>();
    listeners.add(listener);
    this.channels.set(sessionId, listeners);
    void this.publish(sessionId);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.channels.delete(sessionId);
      void this.publish(sessionId);
    };
  }

  /** Pousse un message dans la session ; false si son canal n'est pas ouvert. */
  send(sessionId: string, text: string): boolean {
    const listeners = this.channels.get(sessionId);
    if (!listeners?.size) return false;
    for (const listener of listeners) listener(text);
    return true;
  }

  /** Remise à zéro des scénarios. */
  forget(): void {
    this.channels.clear();
  }

  private async publish(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.find(sessionId);
    if (session) this.events.sessionChanged(this.sessions.viewOf(session));
  }
}
