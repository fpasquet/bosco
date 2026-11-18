import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import type { GroupDto, GroupsDto } from '@bosco/domain';
import type { LevelDefaults } from '../../../shared/domain/session-settings.ts';
import type { GroupService, GroupView } from '../../application/group.service.ts';
import { levelDefaultsSchema } from '../../../shared/interface/http/defaults-schema.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { GROUP_SERVICE } from '../../tokens.ts';
import { settle } from './settle.ts';

const NAME = z.string().max(120);
const DESCRIPTION = z.string().max(500).nullable();
const PROJECTS = z.array(z.number().int().positive()).max(500);
const createSchema = z.object({ name: NAME, description: DESCRIPTION.default(null), projects: PROJECTS.default([]) });
const changeSchema = z.object({
  name: NAME.optional(),
  description: DESCRIPTION.optional(),
  defaults: levelDefaultsSchema.optional(),
  sidebar: z.boolean().optional(),
});
const instructionsSchema = z.object({ instructions: z.string().max(20_000) });
const projectsSchema = z.object({ projects: PROJECTS });

function present(group: GroupView): GroupDto {
  return {
    defaults: group.defaults,
    description: group.description,
    id: group.id,
    instructions: group.instructions,
    name: group.name,
    projects: group.projects.map(({ id, name }) => ({ id, name })),
    sidebar: group.sidebar,
    system: group.system,
  };
}

/** Groupes de projets : ils se lisent partout, ils ne se changent que depuis le poste. */
@Controller('api/groups')
export class GroupsController {
  constructor(@Inject(GROUP_SERVICE) private readonly groups: GroupService) {}

  @Get()
  async listGroups(): Promise<GroupsDto> {
    const groups = await this.groups.listGroups();
    return { groups: groups.map(present) };
  }

  @Get(':id')
  async getGroup(@Param('id', ParseIntPipe) id: number): Promise<GroupDto> {
    const group = await settle(() => this.groups.getGroup(id));
    return present(group);
  }

  @Post()
  async createGroup(@Body() body: unknown): Promise<GroupDto> {
    const input = parseBody(createSchema, body);
    const group = await settle(() => this.groups.createGroup(input));
    return present(group);
  }

  @Patch(':id')
  async changeGroup(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<GroupDto> {
    const settings = parseBody(changeSchema, body);
    const group = await settle(() =>
      this.groups.changeGroup(id, { ...settings, defaults: settings.defaults as Partial<LevelDefaults> | undefined }),
    );
    return present(group);
  }

  @Put(':id/instructions')
  async writeInstructions(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<GroupDto> {
    const { instructions } = parseBody(instructionsSchema, body);
    const group = await settle(() => this.groups.writeInstructions(id, instructions));
    return present(group);
  }

  @Put(':id/projects')
  async arrangeProjects(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<GroupDto> {
    const { projects } = parseBody(projectsSchema, body);
    const group = await settle(() => this.groups.arrangeProjects(id, projects));
    return present(group);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteGroup(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await settle(() => this.groups.deleteGroup(id));
  }
}
