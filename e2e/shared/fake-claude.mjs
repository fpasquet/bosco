#!/usr/bin/env node
// Faux Claude Code des scénarios (sessions pilotées, DT-31) : `claude -p` en flux JSON, réduit à ce que Bosco lit.
// Il écrit le transcript dans le profil comme Claude Code, demande une autorisation si le message parle
// d'« autorisation », pose une question s'il parle de « question », attend « Arrêter » s'il parle d'un « long » travail,
// et répond en rappelant ce qu'il a reçu (réglages du tour, images) pour que les scénarios le vérifient.
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const sessionId = option('--resume') ?? option('--session-id') ?? randomUUID();
const settings = `mode ${option('--permission-mode')} · modèle ${option('--model') ?? 'défaut'} · effort ${option('--effort') ?? 'défaut'}`;
const configDir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude');
const cwd = process.cwd();
const projects = join(configDir, 'projects', cwd.replaceAll('/', '-'));
mkdirSync(projects, { recursive: true });
const transcript = join(projects, `${sessionId}.jsonl`);

let seq = 0;
function record(type, message) {
  seq += 1;
  const line = {
    sessionId,
    cwd,
    version: '2.1.319',
    type,
    uuid: `${sessionId}-${Date.now()}-${seq}`,
    timestamp: new Date().toISOString(),
    message,
  };
  appendFileSync(transcript, `${JSON.stringify(line)}\n`);
}
const out = (line) => process.stdout.write(`${JSON.stringify(line)}\n`);
const reply = (text) =>
  record('assistant', {
    id: `msg_${randomUUID()}`,
    model: option('--model') ?? 'claude-sonnet-5-5',
    role: 'assistant',
    content: [{ type: 'text', text }],
    usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  });

const waiting = new Map();
let interrupted = () => undefined;
function ask(request) {
  const requestId = randomUUID();
  out({ type: 'control_request', request_id: requestId, request: { subtype: 'can_use_tool', ...request } });
  return new Promise((resolve) => waiting.set(requestId, resolve));
}
function finish(text, subtype = 'success') {
  reply(text);
  out({ type: 'result', subtype, is_error: subtype !== 'success', result: text, session_id: sessionId });
}

async function turn(content) {
  const text = content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  const images = content.filter((block) => block.type === 'image').length;
  record('user', { role: 'user', content: text });
  out({ type: 'system', subtype: 'init', session_id: sessionId });
  if (/autorisation/i.test(text)) {
    record('assistant', {
      id: `msg_${randomUUID()}`,
      model: 'claude-sonnet-5-5',
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_bash', name: 'Bash', input: { command: 'npm run db:migrate' } }],
    });
    const answer = await ask({
      tool_name: 'Bash',
      input: { command: 'npm run db:migrate' },
      tool_use_id: 'toolu_bash',
    });
    return finish(answer.behavior === 'allow' ? 'Migration lancée.' : `Refusé : ${answer.message}`);
  }
  if (/question/i.test(text)) {
    const input = {
      questions: [
        {
          question: 'Quel correctif préfères-tu ?',
          header: 'Correctif',
          multiSelect: false,
          options: [
            { label: 'Normaliser la casse à la lecture', description: 'Les sigles gardent leur casse d’origine.' },
            { label: 'Corriger les entrées du lexique', description: '12 entrées à reprendre à la main.' },
          ],
        },
      ],
    };
    record('assistant', {
      id: `msg_${randomUUID()}`,
      model: 'claude-sonnet-5-5',
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_ask', name: 'AskUserQuestion', input }],
    });
    const answer = await ask({
      tool_name: 'AskUserQuestion',
      input,
      tool_use_id: 'toolu_ask',
      requires_user_interaction: true,
    });
    return finish(
      answer.behavior === 'allow'
        ? `Réponse reçue : ${Object.values(answer.updatedInput.answers).join(' ; ')}`
        : 'Question passée.',
    );
  }
  if (/long/i.test(text)) {
    await new Promise((resolve) => {
      interrupted = resolve;
    });
    return finish('Interrompu.', 'error_during_execution');
  }
  return finish(`Reçu : ${text} · ${settings} · images ${images}`);
}

createInterface({ input: process.stdin }).on('line', (raw) => {
  const line = JSON.parse(raw);
  if (line.type === 'control_request' && line.request.subtype === 'initialize')
    out({ type: 'control_response', response: { subtype: 'success', request_id: line.request_id, response: {} } });
  else if (line.type === 'control_request' && line.request.subtype === 'interrupt') {
    for (const [requestId, resolve] of waiting) {
      out({ type: 'control_cancel_request', request_id: requestId });
      resolve({ behavior: 'deny', message: 'Interrompu' });
    }
    waiting.clear();
    interrupted();
  } else if (line.type === 'control_response') {
    const resolve = waiting.get(line.response.request_id);
    waiting.delete(line.response.request_id);
    resolve?.(line.response.response);
  } else if (line.type === 'user') void turn(line.message.content);
});
