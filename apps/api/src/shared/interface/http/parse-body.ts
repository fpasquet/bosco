import type { z } from 'zod';
import { BadRequestException } from '@nestjs/common';

/** Corps de requête validé par un schéma zod ; refusé : 400 avec un code stable que l'interface traduit. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'invalidRequest',
      message: parsed.error.issues.map((issue) => issue.message).join('; '),
    });
  }
  return parsed.data;
}
