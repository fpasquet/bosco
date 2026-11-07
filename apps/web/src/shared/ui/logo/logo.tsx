import { cn } from '@/lib/cn';
import { APP_NAME } from '@bosco/core/shared';

interface LogoProps {
  className?: string;
  /** Seul sur l'écran (en-tête du téléphone) : le logo porte le nom ; à côté du nom écrit, il est décoratif. */
  labelled?: boolean;
}

/** Sifflet de bosco, blanc sur primary : l'appeau qui appelle l'équipage. */
export function Logo({ className, labelled = false }: LogoProps) {
  return (
    <span
      className={cn('grid size-7 shrink-0 place-items-center rounded-control bg-primary text-on-primary', className)}
      {...(labelled ? { role: 'img', 'aria-label': APP_NAME } : { 'aria-hidden': true })}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.6 9.2Q8.4 7.6 13.3 9" />
        <circle cx="17.2" cy="10.4" r="4" />
        <path d="M4.6 11.4Q9.6 15.2 14.4 13.8" />
        <path d="M9.4 14.2V16" />
        <circle cx="9.4" cy="18" r="1.7" />
        <circle cx="17.2" cy="8.4" r="1.15" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
