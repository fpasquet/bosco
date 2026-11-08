import type { Notice } from '@/shared/hooks/use-notices';

/** Ce que dit Bosco quand une autorisation a reçu sa réponse, ici ou dans le terminal (CA-SESS-07, CA-SESS-36). */
export function settledNotice(
  outcome: 'allowed' | 'denied' | 'elsewhere',
  title: string,
): Pick<Notice, 'text' | 'tone'> {
  if (outcome === 'allowed') return { text: `Autorisé · ${title}`, tone: 'success' };
  if (outcome === 'denied') return { text: `Refusé · ${title}`, tone: 'info' };
  return { text: `Répondu dans le terminal · ${title}`, tone: 'info' };
}
