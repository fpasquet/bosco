import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { z } from 'zod';
import type { FolderSuggestionDto, ProjectDetailDto, ProjectDto, ProjectsDto } from '@bosco/domain';
import type { LevelDefaults } from '../../../shared/domain/session-settings.ts';
import type { ProjectDetail, ProjectService, ProjectView } from '../../application/project.service.ts';
import type { ProjectSnapshot } from '../../domain/project.ts';
import type { Suggestion } from '../../domain/suggestions.ts';
import { levelDefaultsSchema } from '../../../shared/interface/http/defaults-schema.ts';
import { parseBody } from '../../../shared/interface/http/parse-body.ts';
import { PROJECT_SERVICE } from '../../tokens.ts';
import { settle } from './settle.ts';

const PATH = z.string().min(1).max(4096);
const addSchema = z.object({ paths: z.array(PATH).min(1).max(200) });
const folderSchema = z.object({ path: PATH });
const domainSchema = z.object({ domain: z.string().trim().min(1).max(253) });
const changeSchema = z.object({
  pinned: z.boolean().optional(),
  place: z.enum(['sandbox', 'workstation']).nullable().optional(),
  startBranch: z.string().max(200).nullable().optional(),
  defaults: levelDefaultsSchema.optional(),
});

function presentProject(project: ProjectSnapshot | ProjectView): ProjectDto {
  const view = 'sessions' in project ? project : { ...project, lastSessionAt: null, sessions: 0 };
  return {
    defaults: view.defaults,
    domains: view.domains,
    git: view.git,
    id: view.id,
    lastSessionAt: view.lastSessionAt?.toISOString() ?? null,
    name: view.name,
    path: view.path,
    pinned: view.pinned,
    place: view.place,
    sessions: view.sessions,
    startBranch: view.startBranch,
  };
}

function presentDetail(project: ProjectDetail): ProjectDetailDto {
  return { ...presentProject(project), branch: project.branch, running: project.running };
}

function presentSuggestion(suggestion: Suggestion): FolderSuggestionDto {
  const { git, lastSessionAt, name, path, preselected, sessions } = suggestion;
  return { git, lastSessionAt: lastSessionAt.toISOString(), name, path, preselected, sessions };
}

/** Projets choisis : la liste se lit partout, elle ne se change que depuis le poste. */
@Controller('api/projects')
export class ProjectsController {
  constructor(@Inject(PROJECT_SERVICE) private readonly projects: ProjectService) {}

  @Get()
  async overview(): Promise<ProjectsDto> {
    const overview = await this.projects.overview();
    return {
      home: overview.home,
      ignored: overview.ignored.map(presentSuggestion),
      outside: overview.outside,
      projects: overview.projects.map(presentProject),
      suggestions: overview.suggestions.map(presentSuggestion),
    };
  }

  @Post()
  async addProjects(@Body() body: unknown): Promise<{ projects: ProjectDto[] }> {
    const { paths } = parseBody(addSchema, body);
    const added = await settle(() => this.projects.addProjects(paths));
    return { projects: added.map(presentProject) };
  }

  @Get(':id')
  async getProject(@Param('id', ParseIntPipe) id: number): Promise<ProjectDetailDto> {
    const project = await settle(() => this.projects.getProject(id));
    return presentDetail(project);
  }

  /** Épingler, désépingler, et les valeurs par défaut des sessions du projet. */
  @Patch(':id')
  async changeProject(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<ProjectDetailDto> {
    const changes = parseBody(changeSchema, body);
    const project = await settle(() =>
      this.projects.changeProject(id, { ...changes, defaults: changes.defaults as Partial<LevelDefaults> | undefined }),
    );
    return presentDetail(project);
  }

  /** Un domaine propre au projet, pour ses bacs à sable (E21a). */
  @Post(':id/domains')
  @HttpCode(200)
  async addDomain(@Param('id', ParseIntPipe) id: number, @Body() body: unknown): Promise<ProjectDetailDto> {
    const { domain } = parseBody(domainSchema, body);
    const project = await settle(() => this.projects.addDomain(id, domain));
    return presentDetail(project);
  }

  @Delete(':id/domains/:domain')
  async removeDomain(
    @Param('id', ParseIntPipe) id: number,
    @Param('domain') domain: string,
  ): Promise<ProjectDetailDto> {
    const project = await settle(() => this.projects.removeDomain(id, domain));
    return presentDetail(project);
  }

  @Delete(':id')
  @HttpCode(204)
  async removeProject(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await settle(() => this.projects.removeProject(id));
  }

  @Post('suggestions/ignore')
  @HttpCode(204)
  async ignoreSuggestion(@Body() body: unknown): Promise<void> {
    const { path } = parseBody(folderSchema, body);
    await settle(() => this.projects.ignoreSuggestion(path));
  }

  @Post('suggestions/restore')
  @HttpCode(204)
  async restoreSuggestion(@Body() body: unknown): Promise<void> {
    const { path } = parseBody(folderSchema, body);
    await settle(() => this.projects.restoreSuggestion(path));
  }
}
