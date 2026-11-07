// Outils du serveur MCP de Bosco (mode Ma session) : une session interactive prend la prochaine tâche de son dépôt,
// signale ses étapes, la termine avec son compte rendu, ou prépare une tâche. Bosco garde la relecture.
import { z } from 'zod';
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

/** Exécute un outil ; une erreur de saisie ou d'état revient à la session comme un résultat en erreur. */
export async function callTool(tasks: TaskService, name: string, args: unknown): Promise<ToolResult> {
  try {
    switch (name) {
      case 'bosco_next_task': {
        const input = nextSchema.parse(args);
        const task = await tasks.takeNext(input.path.replace(/\/$/, ''), input.session_id ?? null);
        return task ? { text: brief(task) } : { text: 'Aucune tâche « Ma session » n’attend dans ce dépôt.' };
      }
      case 'bosco_report_step': {
        const input = stepSchema.parse(args);
        await tasks.note(input.task_id, input.step);
        return { text: 'Étape notée.' };
      }
      case 'bosco_finish_task': {
        const input = finishSchema.parse(args);
        const task = await tasks.get(input.task_id);
        if (task.mode !== 'session') return { error: true, text: `T-${task.id} est une tâche du worker.` };
        await tasks.finish(input.task_id, 0, { report: input.report });
        return { text: `T-${task.id} passe « À relire » dans Bosco.` };
      }
      case 'bosco_create_task': {
        const input = createSchema.parse(args);
        const repository = await tasks.repositoryOf(input.path.replace(/\/$/, ''));
        if (!repository) return { error: true, text: 'Ce dossier n’est dans aucun dépôt connu de Bosco.' };
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
      }
      default:
        return { error: true, text: `Outil inconnu : ${name}` };
    }
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: true, text: `Paramètres invalides : ${error.issues.map((issue) => issue.message).join(', ')}` };
    return { error: true, text: error instanceof Error ? error.message : String(error) };
  }
}
