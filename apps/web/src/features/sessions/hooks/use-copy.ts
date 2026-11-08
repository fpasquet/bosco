'use client';
import { useNotices } from '@/shared/hooks/use-notices';

/** Copie dans le presse-papiers, avec un message bref ; un navigateur qui refuse le dit aussi. */
export function useCopy(): (text: string, label: string) => void {
  const push = useNotices((state) => state.push);
  return (text, label) => {
    navigator.clipboard.writeText(text).then(
      () => push(label, 'success'),
      () => push(`Copie impossible : ${text}`, 'warning'),
    );
  };
}
