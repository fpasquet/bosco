// Notification du bureau envoyée par le service, même sans onglet ouvert (RF-SESS-08) : notify-send sous Linux. Un
// poste sans notify-send n'a pas de notification, sans autre effet.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { Notifier } from '../../application/ports.ts';

/** Emplacements connus de notify-send : un chemin fixe plutôt que la recherche dans PATH. */
const NOTIFY_SEND = ['/usr/bin/notify-send', '/usr/local/bin/notify-send'];

export class DesktopNotifier implements Notifier {
  private readonly command = NOTIFY_SEND.find((path) => existsSync(path)) ?? null;

  constructor(private readonly appName: string) {}

  notify(title: string, body: string): void {
    if (!this.command) return;
    execFile(this.command, [`--app-name=${this.appName}`, '--urgency=normal', title, body], () => undefined);
  }
}

/** Notifications gardées en mémoire, que les scénarios relisent (BOSCO_TEST=1). */
export class RecordingNotifier implements Notifier {
  readonly sent: { body: string; title: string }[] = [];

  notify(title: string, body: string): void {
    this.sent.push({ title, body });
  }
}
