import { BellRing, Box, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@bosco/domain';

// Présentation de l'application : le bloc de bienvenue du premier lancement et « À propos », qui la reprend.

/** Ce que fait l'application, en une phrase. */
export const INTRO =
  'Le maître d’équipage de tes sessions Claude Code : il les surveille pendant qu’elles travaillent et t’appelle quand l’une a besoin de toi.';

/** Ses trois usages, le mot fort en gras. */
export const USES = [
  { icon: BellRing, strong: 't’attendent', before: 'Repère les sessions qui ', after: '' },
  { icon: ShieldCheck, strong: 'Autorise', before: '', after: ` depuis ${APP_NAME} ou ton téléphone` },
  { icon: Box, strong: 'Isole une session', before: '', after: ' dans un bac à sable, sur sa propre branche' },
] as const;
