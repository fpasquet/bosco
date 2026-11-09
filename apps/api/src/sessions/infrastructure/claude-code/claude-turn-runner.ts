// Un tour piloté par Bosco (DT-31) : `claude -p` en flux JSON en entrée et en sortie, dans le dossier du dépôt, avec le
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

const QUESTION_TOOL = 'AskUserQuestion';

/** Mode d'autorisations de Bosco, tel que Claude Code le nomme */
const CLI_MODES: Record<PermissionMode, string> = { acceptEdits: 'acceptEdits', ask: 'default', plan: 'plan' };

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

export class ClaudeTurnRunner implements TurnRunner {
  constructor(private readonly claudeBinary: string) {}

  start(request: TurnRequest, listener: TurnListener): RunningTurn {
    // Le profil par défaut (~/.claude) se lance sans CLAUDE_CONFIG_DIR, comme dans un terminal
    const defaultProfile = request.configDir === join(homedir(), '.claude');
    const env = { ...process.env };
    if (defaultProfile) delete env.CLAUDE_CONFIG_DIR;
    else env.CLAUDE_CONFIG_DIR = request.configDir;
    const child: ChildProcess = spawn(this.claudeBinary, turnArguments(request), {
      cwd: request.cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    let exited = false;
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
      if (line.type === 'control_request') {
        const requestId = String(line.request_id);
        const inner = (line.request ?? {}) as Line;
        if (inner.subtype !== 'can_use_tool') return;
        const tool = String(inner.tool_name);
        const input = (inner.input ?? {}) as Record<string, unknown>;
        if (tool === QUESTION_TOOL) listener.question(requestId, input);
        else listener.permission(requestId, tool, input);
      } else if (line.type === 'control_cancel_request') listener.cancelled(String(line.request_id));
      else if (line.type === 'result') listener.result(typeof line.result === 'string' ? line.result : null);
    });
    child.on('error', (error) => {
      exited = true;
      listener.exited(error.message);
    });
    child.on('exit', (code, signal) => {
      if (exited) return;
      exited = true;
      const failed = code !== 0 && signal !== 'SIGTERM';
      listener.exited(failed ? stderr.trim().split('\n').at(-1) || `code ${code ?? signal}` : null);
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
