// Un tour piloté par Bosco : `claude -p` en flux JSON en entrée et en sortie, dans le dossier du projet, avec le
// dossier de configuration du profil. `--permission-prompt-tool stdio` fait passer les autorisations et les questions de
// l'agent par le protocole de contrôle : Bosco les reçoit sur la sortie et y répond sur l'entrée. Vérifié sur Claude
// Code 2.1.319 ; le protocole de contrôle est celui des SDK, à revérifier à chaque version.
import { type ChildProcess, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import type { RunningTurn, TurnListener, TurnRequest, TurnRunner } from '../../application/pilot.service.ts';
import type { PermissionMode } from '../../domain/pilot.ts';
import { TOKEN_VARIABLE } from '../../../shared/domain/profile-access.ts';
import { quotaWindowsOf } from '../../../shared/domain/subscription-quota.ts';
import { readToken } from '../../../shared/infrastructure/claude-access.ts';

const QUESTION_TOOL = 'AskUserQuestion';

/** Mode d'autorisations de Bosco, tel que Claude Code le nomme (vérifié sur Claude Code 2.1.327) */
const CLI_MODES: Record<PermissionMode, string> = {
  acceptEdits: 'acceptEdits',
  ask: 'default',
  auto: 'auto',
  bypassPermissions: 'bypassPermissions',
  plan: 'plan',
};

/**
 * Raison d'une demande qui suit la suspension d'« Approuver pour moi » : Claude Code repasse aux demandes après 3 refus
 * du vérificateur de suite (« 3 consecutive actions were blocked ») ou 20 au total (« 20 actions were blocked this
 * session »). Lu dans Claude Code 2.1.327.
 */
export function suspensionOf(request: Record<string, unknown>): null | { count: number; total: boolean } {
  const reason = request.decision_reason;
  if (request.decision_reason_type !== 'classifier' || typeof reason !== 'string') return null;
  const consecutive = countBefore(reason, ' consecutive actions were blocked');
  if (consecutive !== null) return { count: consecutive, total: false };
  const total = countBefore(reason, ' actions were blocked this session');
  return total === null ? null : { count: total, total: true };
}

/** Le nombre écrit juste avant une phrase ; null sans la phrase ou sans nombre. */
function countBefore(text: string, phrase: string): null | number {
  const at = text.indexOf(phrase);
  if (at === -1) return null;
  const count = Number(text.slice(0, at).trim().split(' ').at(-1));
  return Number.isInteger(count) ? count : null;
}

/** Une demande de l'agent par le protocole de contrôle : une question, sinon une autorisation. */
function controlRequest(requestId: string, inner: Record<string, unknown>, listener: TurnListener): void {
  if (inner.subtype !== 'can_use_tool') return;
  const tool = String(inner.tool_name);
  const input = (inner.input ?? {}) as Record<string, unknown>;
  const suspended = suspensionOf(inner);
  if (suspended) listener.suspended(suspended.count, suspended.total);
  if (tool === QUESTION_TOOL) listener.question(requestId, input);
  else listener.permission(requestId, tool, input);
}

/** Arguments d'un tour : la session (nouvelle ou reprise) et les réglages du message envoyé. */
export function turnArguments(request: TurnRequest): string[] {
  const { effort, model, permissionMode } = request.settings;
  return [
    '-p',
    '--input-format',
    'stream-json',
    '--output-format',
    'stream-json',
    '--verbose',
    '--permission-prompt-tool',
    'stdio',
    '--permission-mode',
    CLI_MODES[permissionMode],
    ...(model ? ['--model', model] : []),
    ...(effort ? ['--effort', effort] : []),
    ...request.addDirs.flatMap((dir) => ['--add-dir', dir]),
    ...(request.appendSystemPrompt ? ['--append-system-prompt', request.appendSystemPrompt] : []),
    ...(request.resume ? ['--resume', request.sessionId] : ['--session-id', request.sessionId]),
  ];
}

/** Le message tel que l'agent le reçoit : le texte, puis les images jointes. */
export function userMessage(request: TurnRequest): Record<string, unknown> {
  const { images, text } = request.message;
  const content = [
    ...(text ? [{ type: 'text', text }] : []),
    ...images.map(({ data, mediaType }) => ({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data },
    })),
  ];
  return { type: 'user', message: { role: 'user', content } };
}

type Line = Record<string, unknown>;

/** Le jeton longue durée ne se lit plus : le tour ne part pas, et le dit sans rien montrer du jeton. */
export const UNREADABLE_TOKEN =
  'Le jeton longue durée de l’abonnement ne se lit plus : vérifie son fichier dans les réglages du profil.';

/** Un tour qui n'a pas démarré : sa fin est annoncée tout de suite après, comme celle d'un processus en échec. */
function notStarted(listener: TurnListener, error: string): RunningTurn {
  queueMicrotask(() => listener.exited(error));
  const nothing = () => undefined;
  return { allow: nothing, deny: nothing, finish: nothing, interrupt: nothing, pid: null };
}

export class ClaudeTurnRunner implements TurnRunner {
  constructor(private readonly claudeBinary: string) {}

  start(request: TurnRequest, listener: TurnListener): RunningTurn {
    // Le profil par défaut (~/.claude) se lance sans CLAUDE_CONFIG_DIR, comme dans un terminal
    const defaultProfile = request.configDir === join(homedir(), '.claude');
    const env = { ...process.env };
    if (defaultProfile || request.launch) delete env.CLAUDE_CONFIG_DIR;
    else env.CLAUDE_CONFIG_DIR = request.configDir;
    // Les instructions (CLAUDE.md) des projets ajoutés par --add-dir ne se lisent qu'avec ce réglage (vérifié sur
    // Claude Code 2.1.326) ; en bac à sable, la commande du conteneur le passe
    if (request.addDirs.length > 0) env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD = '1';
    // Le jeton d'un abonnement à jeton longue durée, lu au lancement du tour ; jamais celui de l'environnement de Bosco.
    // En bac à sable, docker exec le transmet au conteneur par son nom, sans le mettre dans ses arguments
    delete env[TOKEN_VARIABLE];
    const token = request.tokenFile ? readToken(request.tokenFile) : null;
    if (request.tokenFile && !token) return notStarted(listener, UNREADABLE_TOKEN);
    if (token) env[TOKEN_VARIABLE] = token;
    // Une erreur de l'agent ne montre jamais le jeton : au plus ses 4 derniers caractères
    const masked = (text: string) => (token ? text.replaceAll(token, `…${token.slice(-4)}`) : text);
    // En bac à sable, le tour s'exécute dans le conteneur de la session, entrée ouverte
    const [file, args] = request.launch
      ? [request.launch.file, [...request.launch.args, ...turnArguments(request)]]
      : [this.claudeBinary, turnArguments(request)];
    const child: ChildProcess = spawn(file, args, { cwd: request.cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    let exited = false;
    // Un agent qui s'arrête avant de lire son entrée (accès refusé, binaire en échec) : l'écriture échoue sans arrêter
    // Bosco, la fin du processus dit pourquoi
    child.stdin?.on('error', () => undefined);
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    const send = (line: Line) => {
      if (!exited && child.stdin?.writable) child.stdin.write(`${JSON.stringify(line)}\n`);
    };
    const respond = (requestId: string, response: Line) =>
      send({ type: 'control_response', response: { subtype: 'success', request_id: requestId, response } });
    createInterface({ input: child.stdout! }).on('line', (raw) => {
      let line: Line;
      try {
        line = JSON.parse(raw) as Line;
      } catch {
        return;
      }
      if (line.type === 'control_request')
        controlRequest(String(line.request_id), (line.request ?? {}) as Line, listener);
      else if (line.type === 'control_cancel_request') listener.cancelled(String(line.request_id));
      else if (line.type === 'result') listener.result(typeof line.result === 'string' ? line.result : null);
      else {
        const windows = quotaWindowsOf(line);
        if (windows) listener.quota(windows);
      }
    });
    child.on('error', (error) => {
      exited = true;
      listener.exited(masked(error.message));
    });
    child.on('exit', (code, signal) => {
      if (exited) return;
      exited = true;
      const failed = code !== 0 && signal !== 'SIGTERM';
      listener.exited(failed ? masked(stderr.trim().split('\n').at(-1) || `code ${code ?? signal}`) : null);
    });
    send({ type: 'control_request', request_id: randomUUID(), request: { subtype: 'initialize' } });
    send(userMessage(request));
    return {
      allow: (requestId, input) => respond(requestId, { behavior: 'allow', updatedInput: input }),
      deny: (requestId, message) => respond(requestId, { behavior: 'deny', message }),
      interrupt: () => send({ type: 'control_request', request_id: randomUUID(), request: { subtype: 'interrupt' } }),
      pid: child.pid ?? null,
      finish: () => {
        if (!exited) child.stdin?.end();
      },
    };
  }
}
