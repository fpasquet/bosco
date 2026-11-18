import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { FolderListingDto } from '@bosco/domain';
import type { ProjectService } from '../../application/project.service.ts';
import { PROJECT_SERVICE } from '../../tokens.ts';
import { settle } from './settle.ts';

/** Navigateur de dossiers, réservé au poste : l'écoute du téléphone refuse cette route. */
@Controller('api/folders')
export class FoldersController {
  constructor(@Inject(PROJECT_SERVICE) private readonly projects: ProjectService) {}

  /**
   * `hidden=true` montre aussi les dossiers cachés : pour choisir un dossier de configuration de Claude Code ;
   * `files=true` ajoute les noms des fichiers : pour choisir celui d'un jeton longue durée.
   */
  @Get()
  async browse(
    @Query('path') path?: string,
    @Query('hidden') hidden?: string,
    @Query('files') files?: string,
  ): Promise<FolderListingDto> {
    return settle(() => this.projects.browse(path ?? null, hidden === 'true', files === 'true'));
  }
}
