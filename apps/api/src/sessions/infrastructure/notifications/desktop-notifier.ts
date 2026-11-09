// Notification du bureau envoyée par le service, même sans onglet ouvert (règle 8, E15b) : notify-send sous Linux.
// Un poste sans notify-send n'a pas de notification, sans autre effet ; le centre de notifications garde tout.
import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { DesktopAlerts } from '../../application/notification.service.ts';
import { KIND_LABELS, type NotificationRecord, shortTitle } from '../../domain/notification.ts';

/** Emplacements connus de notify-send et de xdg-open : un chemin fixe plutôt que la recherche dans PATH. */
const NOTIFY_SEND = ['/usr/bin/notify-send', '/usr/local/bin/notify-send'];
const XDG_OPEN = ['/usr/bin/xdg-open', '/usr/local/bin/xdg-open'];
const OPEN_ACTION = 'open';
/** Le titre de la session ou de la tâche, en tête du texte, tient sur une ligne */
const SUBJECT_MAX = 60;

/** Le texte d'une notification du bureau accepte un peu de balisage : le reste s'échappe. */
function escapeMarkup(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Titre et texte de la notification du bureau : le type et le dépôt en titre (« Question · reservations ») ; en
 * texte, la session ou la tâche en gras sur sa ligne, puis l'extrait. Sans dépôt connu, la session passe en titre.
 */
export function desktopText(notification: NotificationRecord): { body: string; title: string } {
  const label =
    notification.kind === 'long-turn' && notification.turnMinutes !== null
      ? `${KIND_LABELS['long-turn']} · ${notification.turnMinutes} min`
      : KIND_LABELS[notification.kind];
  // Une session sans titre prend sa première demande : la notification n'en garde que le début
  const subject = shortTitle(notification.title, SUBJECT_MAX);
  const excerpt = escapeMarkup(notification.excerpt ?? '');
  if (!notification.place) return { title: `${label} · ${subject}`, body: excerpt };
  const body = [`<b>${escapeMarkup(subject)}</b>`, excerpt].filter(Boolean).join('\n');
  return { title: `${label} · ${notification.place}`, body };
}

/**
 * notify-send : l'icône de Bosco, une priorité haute pour ce qui attend une réponse, une seule notification par
 * session ou tâche (la suivante remplace la précédente) et « Ouvrir », qui ouvre la session ou la tâche dans Bosco.
 */
export class NotifySendAlerts implements DesktopAlerts {
  private readonly command = NOTIFY_SEND.find((path) => existsSync(path)) ?? null;
  private readonly opener = XDG_OPEN.find((path) => existsSync(path)) ?? null;
  /** Dernière notification de chaque session ou tâche, à remplacer, et le processus qui attend son clic */
  private readonly shown = new Map<string, { child: ChildProcess; id: null | string }>();

  constructor(
    private readonly appName: string,
    private readonly icon: null | string,
  ) {}

  show(notification: NotificationRecord, options: { url: string; urgent: boolean }): void {
    if (!this.command) return;
    const key =
      notification.taskId === null ? `session:${notification.sessionId ?? ''}` : `task:${notification.taskId}`;
    const previous = this.shown.get(key);
    // L'ancien processus attendait un clic sur la notification remplacée : il n'a plus rien à attendre
    previous?.child.kill();
    const { body, title } = desktopText(notification);
    const child = spawn(
      this.command,
      [
        `--app-name=${this.appName}`,
        `--urgency=${options.urgent ? 'critical' : 'normal'}`,
        '--print-id',
        ...(this.icon ? [`--icon=${this.icon}`] : []),
        ...(previous?.id ? [`--replace-id=${previous.id}`] : []),
        `--action=${OPEN_ACTION}=Ouvrir`,
        title,
        body,
      ],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const entry = { child, id: null as null | string };
    this.shown.set(key, entry);
    child.on('error', () => this.shown.delete(key));
    // Première ligne : l'identifiant de la notification ; ensuite, l'action choisie au clic
    createInterface({ input: child.stdout }).on('line', (line) => {
      const value = line.trim();
      if (entry.id === null && /^\d+$/.test(value)) entry.id = value;
      else if (value === OPEN_ACTION && this.opener)
        spawn(this.opener, [options.url], { detached: true, stdio: 'ignore' }).unref();
    });
  }
}

/** Notifications gardées en mémoire, que les scénarios relisent (BOSCO_TEST=1). */
export class RecordingNotifier implements DesktopAlerts {
  readonly sent: { body: string; title: string; urgent: boolean; url: string }[] = [];

  show(notification: NotificationRecord, options: { url: string; urgent: boolean }): void {
    this.sent.push({ ...desktopText(notification), ...options });
  }
}
