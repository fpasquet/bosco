// Outils du serveur MCP de Bosco : une session lit le contexte du projet où elle travaille, et y propose une décision,
// qui attend ta validation.
import { z } from 'zod';
import type { ContextService } from '../../application/context.service.ts';

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
const paths = {
  type: 'array',
  items: { type: 'string' },
  description: 'Dossiers de travail ajoutés à la session (--add-dir), chemins absolus ; absent s’il n’y en a pas',
};

export const TOOLS: McpTool[] = [
  {
    name: 'bosco_context',
    description:
      'Rend le contexte du projet où tu travailles : les instructions communes et celles de ses groupes, puis ses décisions acceptées, qui l’emportent, et sa place dans l’architecture. Avec des dossiers ajoutés à la session, le contexte de chacun de leurs projets suit celui du projet principal. À lire avant de travailler.',
    inputSchema: { type: 'object', properties: { path, paths }, required: ['path'] },
  },
  {
    name: 'bosco_propose_decision',
    description:
      'Propose une décision durable pour le projet où tu travailles (convention, choix technique). Elle attend la validation de la personne dans Bosco avant d’être transmise à qui que ce soit.',
    inputSchema: {
      type: 'object',
      properties: {
        path,
        title: { type: 'string' },
        context: { type: 'string', description: 'Pourquoi la question se pose' },
        decision: { type: 'string', description: 'Ce qui est décidé' },
        consequences: { type: 'string' },
        alternatives: { type: 'string', description: 'Alternatives écartées, et pourquoi' },
      },
      required: ['path', 'title', 'context', 'decision'],
    },
  },
];

const contextSchema = z.object({ path: z.string().min(1), paths: z.array(z.string().min(1)).max(20).optional() });
const proposeSchema = z.object({
  path: z.string().min(1),
  title: z.string().max(300),
  context: z.string().max(10_000),
  decision: z.string().max(10_000),
  consequences: z.string().max(10_000).optional(),
  alternatives: z.string().max(10_000).optional(),
});
interface ToolDeps {
  context: ContextService;
}

const OUTSIDE: ToolResult = { error: true, text: 'Ce dossier n’est dans aucun projet connu de Bosco.' };

const trim = (path: string) => path.replace(/\/$/, '');

/** Un traitement par outil. */
const HANDLERS: Record<string, (deps: ToolDeps, args: unknown) => Promise<ToolResult>> = {
  async bosco_context({ context }, args) {
    const input = contextSchema.parse(args);
    const text = await context.sessionContext(trim(input.path), (input.paths ?? []).map(trim));
    return text === null ? OUTSIDE : { text };
  },
  async bosco_propose_decision({ context }, args) {
    const input = proposeSchema.parse(args);
    const project = await context.projectOf(trim(input.path));
    if (!project) return OUTSIDE;
    const text = {
      title: input.title,
      context: input.context,
      decision: input.decision,
      consequences: input.consequences ?? null,
      alternatives: input.alternatives ?? null,
    };
    const decision = await context.propose(project.name, text, trim(input.path));
    return { text: `DEC-${decision.id} proposée : elle attend la validation de la personne dans Bosco.` };
  },
};

/** Exécute un outil ; une erreur de saisie ou d'état revient à la session comme un résultat en erreur. */
export async function callTool(context: ContextService, name: string, args: unknown): Promise<ToolResult> {
  const handler = HANDLERS[name];
  if (!handler) return { error: true, text: `Outil inconnu : ${name}` };
  try {
    return await handler({ context }, args);
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: true, text: `Paramètres invalides : ${error.issues.map((issue) => issue.message).join(', ')}` };
    return { error: true, text: error instanceof Error ? error.message : String(error) };
  }
}
