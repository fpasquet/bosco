import { z } from 'zod';
import { EFFORTS, PERMISSION_MODES } from '../../domain/session-settings.ts';

/** Réglages d'une session à un niveau (profil, projet, groupe, session) : chacun peut être null, c'est-à-dire hérité. */
export const sessionDefaultsSchema = z.object({
  effort: z.enum(EFFORTS as [string, ...string[]]).nullable(),
  model: z.string().trim().max(100).nullable(),
  permissionMode: z.enum(PERMISSION_MODES as [string, ...string[]]).nullable(),
});

/** Changements des valeurs par défaut d'un projet ou d'un groupe : le profil en plus, chaque champ facultatif. */
export const levelDefaultsSchema = sessionDefaultsSchema.extend({ profile: z.string().max(4096).nullable() }).partial();
