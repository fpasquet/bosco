import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DomainError } from '../../../shared/domain/domain-error.ts';
import { FolderNotFound } from '../../domain/folder.ts';
import { ProjectAlreadyAdded, UnknownProject } from '../../domain/project.ts';

/** Erreurs du domaine en statut HTTP, avec leur code stable : inconnu en 404, déjà ajouté en 409, le reste en 400. */
export async function settle<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    const body = { code: error.code, message: error.message };
    if (error instanceof UnknownProject || error instanceof FolderNotFound)
      throw new NotFoundException({ statusCode: 404, ...body });
    if (error instanceof ProjectAlreadyAdded) throw new ConflictException({ statusCode: 409, ...body });
    throw new BadRequestException({ statusCode: 400, ...body });
  }
}
