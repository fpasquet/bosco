// Outils du serveur MCP de Bosco (mode Ma session) : une session interactive prend la prochaine tâche de son dépôt,
// signale ses étapes, la termine avec son compte rendu, ou prépare une tâche. Bosco garde la relecture.
import { z } from 'zod';
import type { ContextService } from '../../../context/application/context.service.ts';
import type { TaskService, TaskView } from '../../application/task.service.ts';

export interface McpTool {
  description: string;
  inputSchema: Record<string, unknown>;
  name: string;
}

/** Texte rendu à la session ; error : l'appel n'a rien changé. */
export interface ToolResult {
  error?: boolean;
  text: string;
}

const path = { type: 'string', description: 'Dossier de travail absolu de la session (son cwd)' };

export const TOOLS: McpTool[] = [
  {
    name: 'bosco_context',
    description:
      'Rend le contexte du dépôt où tu travailles : ses décisions acceptées, celles des socles qui s’y appliquent et sa place dans l’architecture. À lire avant de travailler.',
    inputSchema: { type: 'object', properties: { path }, required: ['path'] },
  },
  {
    name: 'bosco_propose_decision',
    description:
      'Propose une décision durable pour le dépôt où tu travailles (convention, choix technique). Elle attend la validation de la personne dans Bosco avant d’être transmise à qui que ce soit.',
    inputSchema: {
      type: 'object',
      properties: {
        path,
        title: { type: 'string' },
        context: { type: 'string', description: 'Pourquoi la question se pose' },
        decision: { type: 'string', description: 'Ce qui est décidé' },
        consequences: { type: 'string' },
        alternatives: { type: 'string', description: 'Alternatives écartées, et pourquoi' },
        task_id: { type: 'number', description: 'Tâche Bosco en cours, s’il y en a une' },
      },
      required: ['path', 'title', 'context', 'decision'],
    },
  },
  {
    name: 'bosco_next_task',
    description:
      'Prend la prochaine tâche Bosco « Ma session » du dépôt où tu travailles, et rend sa consigne. À appeler quand on te demande « prends la prochaine tâche Bosco ».',
    inputSchema: {
      type: 'object',
      properties: {
        path,
        session_id: { type: 'string', description: 'Identifiant de ta session Claude Code, si tu le connais' },
      },
      required: ['path'],
    },
  },
  {
    name: 'bosco_report_step',
    description: 'Signale une étape de la tâche Bosco en cours, en une phrase : elle s’affiche dans son journal.',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'number' }, step: { type: 'string' } },
      required: ['task_id', 'step'],
    },
  },
  {
    name: 'bosco_finish_task',
    description:
      'Termine la tâche Bosco en cours avec ton compte rendu : ce qui est fait, et ce qu’il reste à vérifier. Elle passe « À relire » dans Bosco.',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'number' }, report: { type: 'string' } },
      required: ['task_id', 'report'],
    },
  },
  {
    name: 'bosco_create_task',
    description:
      'Prépare une tâche Bosco dans le dépôt où tu travailles, pour le worker (sans terminal) ou pour une session. Elle attend dans la file de Bosco.',
    inputSchema: {
      type: 'object',
      properties: {
        path,
        instruction: { type: 'string' },
        mode: { type: 'string', enum: ['worker', 'session'], description: 'worker par défaut' },
      },
      required: ['path', 'instruction'],
    },
  },
];

const contextSchema = z.object({ path: z.string().min(1) });
const proposeSchema = z.object({
  path: z.string().min(1),
  title: z.string().max(300),
  context: z.string().max(10_000),
  decision: z.string().max(10_000),
  consequences: z.string().max(10_000).optional(),
  alternatives: z.string().max(10_000).optional(),
  task_id: z.number().int().optional(),
});
const nextSchema = z.object({ path: z.string().min(1), session_id: z.string().optional() });
const stepSchema = z.object({ task_id: z.number().int(), step: z.string().trim().min(1).max(500) });
const finishSchema = z.object({ task_id: z.number().int(), report: z.string().trim().min(1).max(20_000) });
const createSchema = z.object({
  path: z.string().min(1),
  instruction: z.string().trim().min(1).max(5000),
  mode: z.enum(['worker', 'session']).default('worker'),
});

function brief(task: TaskView): string {
  return [
    `Tâche T-${task.id} : ${task.title}`,
    task.folder ? `Dépôt : ${task.repository.root} (dossier ${task.folder})` : `Dépôt : ${task.repository.root}`,
    `Consigne :\n${task.instruction}`,
    task.context ? `Contexte : ${task.context}` : null,
    `Signale tes étapes avec bosco_report_step, puis termine avec bosco_finish_task (task_id ${task.id}) et ton compte rendu.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

interface ToolDeps {
  context: ContextService;
  tasks: TaskService;
}

const OUTSIDE: ToolResult = { error: true, text: 'Ce dossier n’est dans aucun dépôt connu de Bosco.' };

const trim = (path: string) => path.replace(/\/$/, '');

/** Un traitement par outil. */
const HANDLERS: Record<string, (deps: ToolDeps, args: unknown) => Promise<ToolResult>> = {
  async bosco_context({ context, tasks }, args) {
    const input = contextSchema.parse(args);
    const repository = await tasks.repositoryOf(trim(input.path));
    if (!repository) return OUTSIDE;
    const preview = await context.preview(repository.name);
    return { text: preview.text };
  },
  async bosco_propose_decision({ context, tasks }, args) {
    const input = proposeSchema.parse(args);
    const repository = await tasks.repositoryOf(trim(input.path));
    if (!repository) return OUTSIDE;
    const text = {
      title: input.title,
      context: input.context,
      decision: input.decision,
      consequences: input.consequences ?? null,
      alternatives: input.alternatives ?? null,
    };
    const decision = await context.propose(repository.name, text, input.task_id ?? null);
    return { text: `DEC-${decision.id} proposée : elle attend la validation de la personne dans Bosco.` };
  },
  async bosco_next_task({ tasks }, args) {
    const input = nextSchema.parse(args);
    const task = await tasks.takeNext(trim(input.path), input.session_id ?? null);
    return task ? { text: brief(task) } : { text: 'Aucune tâche « Ma session » n’attend dans ce dépôt.' };
  },
  async bosco_report_step({ tasks }, args) {
    const input = stepSchema.parse(args);
    await tasks.note(input.task_id, input.step);
    return { text: 'Étape notée.' };
  },
  async bosco_finish_task({ tasks }, args) {
    const input = finishSchema.parse(args);
    const task = await tasks.get(input.task_id);
    if (task.mode !== 'session') return { error: true, text: `T-${task.id} est une tâche du worker.` };
    await tasks.finish(input.task_id, 0, { report: input.report });
    return { text: `T-${task.id} passe « À relire » dans Bosco.` };
  },
  async bosco_create_task({ tasks }, args) {
    const input = createSchema.parse(args);
    const repository = await tasks.repositoryOf(trim(input.path));
    if (!repository) return OUTSIDE;
    const task = await tasks.create(
      {
        repository: repository.name,
        folder: repository.folder,
        instruction: input.instruction,
        mode: input.mode,
        prerequisites: [],
        context: null,
        guardrails: { budgetUsd: 1, maxTurns: 30, model: null, tools: null },
      },
      'session',
    );
    return { text: `T-${task.id} créée dans ${task.repository.name} : elle attend dans la file de Bosco.` };
  },
};

/** Exécute un outil ; une erreur de saisie ou d'état revient à la session comme un résultat en erreur. */
export async function callTool(
  tasks: TaskService,
  context: ContextService,
  name: string,
  args: unknown,
): Promise<ToolResult> {
  const handler = HANDLERS[name];
  if (!handler) return { error: true, text: `Outil inconnu : ${name}` };
  try {
    return await handler({ context, tasks }, args);
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: true, text: `Paramètres invalides : ${error.issues.map((issue) => issue.message).join(', ')}` };
    return { error: true, text: error instanceof Error ? error.message : String(error) };
  }
}
