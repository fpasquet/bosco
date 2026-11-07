import { Body, Controller, Get, Headers, HttpCode, Inject, Post, Res, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { APP_NAME } from '@bosco/domain';
import type { ContextService } from '../../../context/application/context.service.ts';
import type { TaskService } from '../../application/task.service.ts';
import { CONTEXT_SERVICE } from '../../../context/tokens.ts';
import { HOOK_SECRET } from '../../../sessions/tokens.ts';
import { TASK_SERVICE } from '../../tokens.ts';
import { callTool, TOOLS } from './tools.ts';

/** Version du protocole MCP rendue quand le client n'en propose pas. */
const PROTOCOL = '2025-06-18';

interface JsonRpcRequest {
  id?: null | number | string;
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

/**
 * Serveur MCP de Bosco (mode Ma session), en HTTP sur le port du service, sans session : chaque requête JSON-RPC
 * reçoit sa réponse. Il exige le secret de l'installation, comme l'entrée des hooks.
 */
@Controller('mcp')
export class McpController {
  constructor(
    @Inject(TASK_SERVICE) private readonly tasks: TaskService,
    @Inject(HOOK_SECRET) private readonly secret: string,
    @Inject(CONTEXT_SERVICE) private readonly context: ContextService,
  ) {}

  /** Pas de flux d'événements du serveur vers la session. */
  @Get()
  @HttpCode(405)
  stream(): void {
    return undefined;
  }

  @Post()
  async handle(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: JsonRpcRequest | JsonRpcRequest[],
    @Res({ passthrough: true }) reply: { status(code: number): unknown },
  ): Promise<unknown> {
    this.authenticate(authorization);
    const requests = Array.isArray(body) ? body : [body];
    const results = await Promise.all(requests.map((request) => this.answer(request)));
    const answers = results.filter(Boolean);
    // Rien que des notifications : accusé de réception, sans corps
    if (answers.length === 0) {
      void reply.status(202);
      return undefined;
    }
    return Array.isArray(body) ? answers : answers[0];
  }

  private async answer(request: JsonRpcRequest): Promise<unknown> {
    if (request.id === undefined || request.id === null) return null;
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: request.id, result });
    switch (request.method) {
      case 'initialize':
        return ok({
          protocolVersion:
            typeof request.params?.protocolVersion === 'string' ? request.params.protocolVersion : PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: { name: APP_NAME.toLowerCase(), version: '1' },
          instructions:
            'Tâches Bosco « Ma session » : quand on te demande de prendre la prochaine tâche Bosco, appelle bosco_next_task avec ton dossier de travail.',
        });
      case 'ping':
        return ok({});
      case 'tools/list':
        return ok({ tools: TOOLS });
      case 'tools/call': {
        const name = typeof request.params?.name === 'string' ? request.params.name : '';
        const result = await callTool(this.tasks, this.context, name, request.params?.arguments ?? {});
        return ok({ content: [{ type: 'text', text: result.text }], isError: result.error ?? false });
      }
      default:
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32_601, message: `Unknown method ${request.method}` },
        };
    }
  }

  private authenticate(authorization: string | undefined): void {
    const expected = Buffer.from(`Bearer ${this.secret}`);
    const given = Buffer.from(authorization ?? '');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new UnauthorizedException();
  }
}
