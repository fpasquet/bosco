import type { ChildProcess } from 'node:child_process';
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  type MenuItemConstructorOptions,
  nativeImage,
  Notification,
  shell,
  Tray,
} from 'electron';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Application du poste (E17, DT-33) : une coquille autour du service et de l'interface de Bosco. Elle démarre le service
// (ou se relie à celui qui tourne déjà), montre l'interface dans sa fenêtre, tient l'icône de la barre système et
// montre les notifications en natif. Facultative : Bosco se lance toujours dans le navigateur (règle 2 du lot 4).
import type { NotificationDto, SessionDto } from '@bosco/domain';
import { isAutostart, setAutostart } from './autostart.ts';
import { LiveEvents } from './events.ts';
import { nativeText, pathOf } from './notification-text.ts';
import { loadPreferences, savePreferences } from './preferences.ts';
import { findNode, healthy, serviceLayout, startService, stopUserService, waitFor } from './service.ts';
import { type TrayAction, trayMenu, trayTooltip, waitingSessions } from './tray-menu.ts';

/** Dossier de l'application : apps/desktop dans le dépôt, resources/app une fois installée par le paquet */
const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(APP_DIR, 'assets');
const PORT = Number(process.env.BOSCO_PORT ?? 4870);
const BASE = `http://127.0.0.1:${PORT}`;
/** L'application redit sa présence à ce rythme : le service lui laisse alors les notifications (CA-APPS-03) */
const PRESENCE_MS = 15_000;
const PAUSE_MS = 60 * 60 * 1000;

let window: BrowserWindow | null = null;
let tray: null | Tray = null;
let service: ChildProcess | null = null;
let quitting = false;
let pausedUntil = 0;
let waiting: SessionDto[] = [];
const hidden = process.argv.includes('--hidden');

function show(path = '/'): void {
  if (!window) return;
  void window.loadURL(`${BASE}${path}`);
  window.show();
  window.focus();
}

function createWindow(): BrowserWindow {
  const created = new BrowserWindow({
    width: 1280,
    height: 860,
    title: 'Bosco',
    icon: join(ASSETS, 'icon-256.png'),
    show: !hidden,
    autoHideMenuBar: true,
  });
  void created.loadURL(BASE);
  // Un lien vers l'extérieur (GitHub, Jira…) s'ouvre dans le navigateur
  created.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(BASE)) void shell.openExternal(url);
    return { action: url.startsWith(BASE) ? 'allow' : 'deny' };
  });
  // Fermer la fenêtre garde Bosco dans la barre système ; « Quitter Bosco » l'arrête
  created.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    created.hide();
  });
  return created;
}

function act(action: TrayAction): void {
  switch (action.kind) {
    case 'open':
      show(action.path);
      break;
    case 'new-session':
      show('/sessions/new');
      break;
    case 'pause':
      pausedUntil = pausedUntil > Date.now() ? 0 : Date.now() + PAUSE_MS;
      refreshTray();
      break;
    case 'autostart':
      setAutostart(homedir(), !isAutostart(homedir()), launchCommand(), join(ASSETS, 'icon-256.png'));
      refreshTray();
      break;
    case 'quit':
      quitting = true;
      app.quit();
      break;
  }
}

/** Relancée comme elle l'a été : l'exécutable du paquet, ou Electron sur le dossier du dépôt (sans bac à sable si
 * chrome-sandbox n'est pas configuré) */
function launchCommand(): string {
  const sandbox = process.argv.filter((arg) => arg === '--no-sandbox');
  return [process.execPath, ...(app.isPackaged ? [] : [APP_DIR]), ...sandbox].join(' ');
}

function refreshTray(): void {
  if (!tray) return;
  const items = trayMenu(waiting, { autostart: isAutostart(homedir()), paused: pausedUntil > Date.now() });
  const template = items.map((item): MenuItemConstructorOptions => {
    if (item.type === 'separator') return { type: 'separator' };
    if (item.type === 'header') return { label: item.label, enabled: false };
    return { label: item.label, type: item.type, checked: item.checked, click: () => act(item.action) };
  });
  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip(trayTooltip(waiting.length));
  tray.setImage(join(ASSETS, waiting.length > 0 ? 'tray-waiting.png' : 'tray.png'));
}

function notify(notification: NotificationDto, inApp: boolean): void {
  // Bosco au premier plan : le message bref s'affiche déjà dans la fenêtre (CA-SESS-86)
  if (inApp || pausedUntil > Date.now() || !Notification.isSupported()) return;
  const { body, title } = nativeText(notification);
  const native = new Notification({
    title,
    body,
    icon: nativeImage.createFromPath(join(ASSETS, 'icon-256.png')),
    urgency: ['permission', 'question', 'turn-question'].includes(notification.kind) ? 'critical' : 'normal',
  });
  native.on('click', () => show(pathOf(notification)));
  native.show();
}

/** Un service répond déjà : s'y relier (par défaut) ou le remplacer ; le choix est gardé (E17b). */
async function serviceChoice(): Promise<'attach' | 'own' | 'quit'> {
  const preferences = loadPreferences(app.getPath('userData'));
  if (preferences.service) return preferences.service;
  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'Bosco tourne déjà sur ce poste',
    message: 'Bosco tourne déjà sur ce poste',
    detail:
      `Un service Bosco répond sur ${BASE}. L'application peut s'en servir, ou le remplacer : ` +
      'ses sessions, ses tâches et ses réglages sont gardés.\n\n' +
      '• Se relier au service : l’application n’est qu’une fenêtre sur le service, qui continue de tourner sans elle, ' +
      'comme avant dans le navigateur.\n' +
      '• Remplacer le service : il s’arrête et ne démarre plus seul ; l’application fait tourner Bosco.',
    buttons: ['Se relier au service', 'Remplacer le service par l’application', 'Quitter'],
    defaultId: 0,
    cancelId: 2,
  });
  const choice = (['attach', 'own', 'quit'] as const)[response] ?? 'quit';
  if (choice !== 'quit') savePreferences(app.getPath('userData'), { service: choice });
  return choice;
}

async function ensureService(): Promise<boolean> {
  if (await healthy(BASE)) {
    const choice = await serviceChoice();
    if (choice === 'quit') return false;
    if (choice === 'attach') return true;
    await stopUserService();
    await waitFor(async () => !(await healthy(BASE)), 10_000);
  }
  const layout = serviceLayout({ appDir: APP_DIR, packaged: app.isPackaged, resourcesPath: process.resourcesPath });
  const node = layout.node ?? (await findNode(homedir(), process.env));
  if (!node) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Node introuvable',
      message: 'Bosco a besoin de Node 26 sur le poste.',
      detail: 'Installe Node 26 (par exemple avec nvm), ou indique son chemin dans BOSCO_NODE.',
    });
    return false;
  }
  service = startService({ node, port: PORT, apiMain: layout.apiMain, webDir: layout.webDir });
  return waitFor(() => healthy(BASE), 60_000);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.setName('Bosco');
  app.on('second-instance', () => show());
  // Une coquille qui vit dans la barre système : fermer la dernière fenêtre ne quitte pas
  app.on('window-all-closed', () => undefined);
  app.on('before-quit', () => {
    quitting = true;
    service?.kill('SIGTERM');
  });
  void app.whenReady().then(async () => {
    const ready = await ensureService();
    if (!ready) {
      app.quit();
      return;
    }
    window = createWindow();
    tray = new Tray(join(ASSETS, 'tray.png'));
    tray.on('click', () => show());
    refreshTray();
    new LiveEvents(BASE, {
      sessions: (sessions) => {
        waiting = waitingSessions(sessions.values());
        refreshTray();
      },
      notified: notify,
    }).start();
    // Présence de l'application : le service ne lance plus notify-send, c'est elle qui notifie
    const present = () =>
      void fetch(`${BASE}/api/presence`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ app: true }),
      }).catch(() => undefined);
    present();
    setInterval(present, PRESENCE_MS);
  });
}
