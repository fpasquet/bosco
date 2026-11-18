import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { FolderListingDto } from '@bosco/domain';
import type { ProjectService } from '../../application/project.service.ts';
import { PROJECT_SERVICE } from '../../tokens.ts';
import { settle } from './settle.ts';

/** Navigateur de dossiers, réservé au poste : l'écoute du téléphone refuse cette route. */
@Controller('api/folders')
export class FoldersController {
  constructor(@Inject(PROJECT_SERVICE) private readonly projects: ProjectService) {}

  @Get()
  async browse(@Query('path') path?: string): Promise<FolderListingDto> {
    return settle(() => this.projects.browse(path ?? null));
  }
}
