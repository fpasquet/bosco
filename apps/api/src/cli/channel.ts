// Serveur du canal de Bosco (E2i, DT-32) : Claude Code le lance avec une session du terminal démarrée avec
// `--dangerously-load-development-channels server:bosco-channel`. Il parle MCP sur son entrée et sa sortie, se déclare
// canal (capacité expérimentale claude/channel), puis suit le flux de sa session chez Bosco : chaque message écrit dans
// Bosco devient une notification notifications/claude/channel, que Claude Code injecte dans la session.
import { createInterface } from 'node:readline';

const RETRY_MS = 2000;

const INSTRUCTIONS =
  'Messages from Bosco arrive as <channel source="bosco-channel">. They are typed by the user in Bosco, the dashboard ' +
  'of their Claude Code sessions, instead of this terminal: treat each one exactly as a message the user typed here.';

type Write = (line: Record<string, unknown>) => void;

/** Réponse aux requêtes MCP : l'initialisation déclare le canal, le reste est vide (aucun outil, aucune ressource). */
export function answer(request: {
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
}): null | Record<string, unknown> {
  if (request.id === undefined || !request.method) return null;
  if (request.method === 'initialize')
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: request.params?.protocolVersion ?? '2025-06-18',
        capabilities: { experimental: { 'claude/channel': {} } },
        serverInfo: { name: 'bosco-channel', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      },
    };
  const empty: Record<string, unknown> = {
    'tools/list': { tools: [] },
    'resources/list': { resources: [] },
    'prompts/list': { prompts: [] },
  };
  return { jsonrpc: '2.0', id: request.id, result: empty[request.method] ?? {} };
}

/** Lit un flux SSE : un appel par événement « message », avec son texte. */
async function follow(
  url: string,
  secret: string,
  onMessage: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${secret}`, accept: 'text/event-stream' },
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`Bosco answered ${response.status}`);
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let end = buffer.indexOf('\n\n');
    while (end >= 0) {
      const event = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const type = /^event: (.*)$/m.exec(event)?.[1];
      const data = event
        .split('\n')
        .filter((line) => line.startsWith('data: '))
        .map((line) => line.slice(6))
        .join('\n');
      if (type === 'message' && data) onMessage((JSON.parse(data) as { text: string }).text);
      end = buffer.indexOf('\n\n');
    }
  }
}

/** Le canal d'une session : MCP sur stdio, et le flux de la session chez Bosco, repris s'il tombe. */
export function runChannel(options: { port: number; secret: string; sessionId: null | string; write?: Write }): void {
  const write: Write = options.write ?? ((line) => process.stdout.write(`${JSON.stringify(line)}\n`));
  const controller = new AbortController();
  let started = false;
  const start = () => {
    if (started || !options.sessionId) return;
    started = true;
    const url = `http://127.0.0.1:${options.port}/api/channel/stream?session=${encodeURIComponent(options.sessionId)}`;
    const push = (text: string) =>
      write({
        jsonrpc: '2.0',
        method: 'notifications/claude/channel',
        params: { content: text, meta: { from: 'bosco' } },
      });
    const loop = async (): Promise<void> => {
      while (!controller.signal.aborted) {
        try {
          await follow(url, options.secret, push, controller.signal);
        } catch {
          // Bosco arrêté ou redémarré : on réessaie
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      }
    };
    void loop();
  };
  const input = createInterface({ input: process.stdin });
  input.on('line', (raw) => {
    let request: { id?: unknown; method?: string; params?: Record<string, unknown> };
    try {
      request = JSON.parse(raw) as typeof request;
    } catch {
      return;
    }
    const reply = answer(request);
    if (reply) write(reply);
    if (request.method === 'notifications/initialized') start();
  });
  input.on('close', () => {
    controller.abort();
    process.exit(0);
  });
}
