import { Box } from 'lucide-react';

/** La marque « Bac à sable » suit une session en bac à sable partout : en-tête, vue d'ensemble, historique. */
export function SandboxMark() {
  return (
    <span className="badge shrink-0 gap-1 badge-soft font-sans badge-sm font-medium badge-primary">
      <Box aria-hidden className="size-3" />
      Bac à sable
    </span>
  );
}
