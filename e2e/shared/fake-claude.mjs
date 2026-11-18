#!/usr/bin/env node
// Faux Claude Code des scénarios (sessions pilotées, DT-31) : `claude -p` en flux JSON, réduit à ce que Bosco lit.
// Il écrit le transcript dans le profil comme Claude Code, rappelle les dossiers ajoutés (--add-dir) et s'il lit leurs
// instructions, demande une autorisation si le message parle
// d'« autorisation » (deux de suite pour « deux autorisations », la seconde sautée si le mode passe à l'accès complet), pose une question s'il parle de « question », attend « Arrêter » s'il parle d'un « long » travail,
// rend la main à Bosco comme après 3 refus du vérificateur s'il parle de « refus » en « Approuver pour moi », redit le contexte reçu au lancement s'il parle de « contexte », et répond en rappelant ce qu'il a reçu (réglages du tour, images, fin du jeton longue durée) pour que les scénarios le vérifient.
import { randomUUID } from 'node:crypto';
import { appendFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const args = process.argv.slice(2);

// `claude mcp add-json --scope user <nom> <json>` et `claude mcp remove --scope user <nom>` : le canal de Bosco (E4f)
if (args[0] === 'mcp') {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const file = join(process.env.CLAUDE_CONFIG_DIR ?? homedir(), '.claude.json');
  let config = {};
  try {
    config = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    // pas encore de configuration
  }
  config.mcpServers ??= {};
  if (args[1] === 'add-json') config.mcpServers[args[4]] = JSON.parse(args[5]);
  else if (args[1] === 'remove') delete config.mcpServers[args[4]];
  writeFileSync(file, JSON.stringify(config, null, 2));
  process.exit(0);
}
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const sessionId = option('--resume') ?? option('--session-id') ?? randomUUID();
const settings = `mode ${option('--permission-mode')} · modèle ${option('--model') ?? 'défaut'} · effort ${option('--effort') ?? 'défaut'}`;
// Jeton longue durée reçu par l'environnement (CLAUDE_CODE_OAUTH_TOKEN) : ses 4 derniers caractères, jamais plus
const token = process.env.CLAUDE_CODE_OAUTH_TOKEN;
const tokenNote = token ? ` · jeton …${token.slice(-4)}` : '';
// Dossiers ajoutés à la session (--add-dir), rejoués à chaque tour ; leurs CLAUDE.md ne se lisent qu'avec le réglage
const added = args.flatMap((arg, index) => (arg === '--add-dir' ? [args[index + 1]?.split('/').at(-1)] : []));
const instructions = process.env.CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD === '1' ? ' avec leurs instructions' : '';
const addedNote = added.length > 0 ? ` · dossiers ajoutés ${added.join(', ')}${instructions}` : '';
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

// Mode d'autorisations du tour : celui du lancement, puis celui que Bosco règle en cours de tour (set_permission_mode)
let mode = option('--permission-mode');
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

/** Deux commandes de suite : la seconde n'est plus demandée si Bosco est passé à l'accès complet entre-temps. */
async function twoCommands() {
  const first = await ask({ tool_name: 'Bash', input: { command: 'npm run db:migrate' }, tool_use_id: 'toolu_1' });
  if (first.behavior !== 'allow') return finish(`Refusé : ${first.message}`);
  if (mode !== 'bypassPermissions') {
    const second = await ask({ tool_name: 'Bash', input: { command: 'npm run db:seed' }, tool_use_id: 'toolu_2' });
    if (second.behavior !== 'allow') return finish(`Refusé : ${second.message}`);
  }
  return finish(`Deux commandes lancées · mode ${mode}`);
}

/** Le contexte des projets reçu au lancement (--append-system-prompt) : ses titres, pour que les scénarios le lisent. */
function receivedContext() {
  const context = option('--append-system-prompt');
  const titles = context ? context.split('\n').filter((line) => /^(# |- DEC-)/.test(line)) : [];
  return `Contexte reçu : ${titles.length > 0 ? titles.join(' · ') : 'aucun'}`;
}

async function turn(content) {
  const text = content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  const images = content.filter((block) => block.type === 'image').length;
  record('user', { role: 'user', content: text });
  out({ type: 'system', subtype: 'init', session_id: sessionId });
  if (/deux autorisations/i.test(text)) return twoCommands();
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
  if (/refus/i.test(text) && option('--permission-mode') === 'auto') {
    // Le vérificateur a refusé 3 actions de suite : Claude Code suspend « Approuver pour moi » et demande à Bosco
    const answer = await ask({
      tool_name: 'Bash',
      input: { command: 'rm -rf node_modules' },
      tool_use_id: 'toolu_rm',
      decision_reason:
        '3 consecutive actions were blocked. Please review the transcript before continuing. Latest blocked action: rm -rf node_modules',
      decision_reason_type: 'classifier',
    });
    return finish(answer.behavior === 'allow' ? 'Nettoyage lancé.' : `Refusé : ${answer.message}`);
  }
  if (/question/i.test(text)) {
    const input = {
      questions: [
        {
          question: 'Quel correctif préfères-tu ?',
          header: 'Correctif',
          multiSelect: false,
          options: [
            {
              label: 'Arrondir à la minute à la lecture (Recommended)',
              description: 'Les créneaux gardent leur heure d’origine.',
            },
            { label: 'Corriger les grilles de tarifs', description: '12 grilles à reprendre à la main.' },
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
  if (/contexte/i.test(text)) return finish(receivedContext());
  if (/long/i.test(text)) {
    await new Promise((resolve) => {
      interrupted = resolve;
    });
    return finish('Interrompu.', 'error_during_execution');
  }
  return finish(`Reçu : ${text} · ${settings} · images ${images}${addedNote}${tokenNote}`);
}

createInterface({ input: process.stdin }).on('line', (raw) => {
  const line = JSON.parse(raw);
  if (line.type === 'control_request' && line.request.subtype === 'initialize')
    out({ type: 'control_response', response: { subtype: 'success', request_id: line.request_id, response: {} } });
  else if (line.type === 'control_request' && line.request.subtype === 'set_permission_mode') {
    mode = line.request.mode;
    out({
      type: 'control_response',
      response: { subtype: 'success', request_id: line.request_id, response: { mode } },
    });
  } else if (line.type === 'control_request' && line.request.subtype === 'interrupt') {
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
