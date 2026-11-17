import { SquareTerminal } from 'lucide-react';

export interface SidebarProfilesProps {
  profiles: { count: number; label: string; path: string }[];
}

/** Profils Claude Code surveillés, dans la barre latérale, avec leurs sessions ouvertes. */
export function SidebarProfiles({ profiles }: SidebarProfilesProps) {
  if (profiles.length === 0) return null;
  return (
    <>
      <p id="sidebar-profiles" className="mt-5 px-2.5 text-xs font-semibold tracking-wider uppercase">
        Profils Claude Code
      </p>
      <ul aria-labelledby="sidebar-profiles" className="mt-1 flex flex-col gap-0.5">
        {profiles.map(({ count, label, path }) => (
          <li key={path} className="flex h-8 items-center gap-3 px-2.5">
            <SquareTerminal aria-hidden className="size-4 shrink-0" />
            {label}
            <span className="truncate font-mono text-xs">{path}</span>
            <span className="ml-auto font-mono text-xs">{count}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
