/** Classes partagées par les menus ⋯ d'un projet et d'un groupe. */
export const MENU_CONTENT =
  'z-50 max-w-xs min-w-56 overflow-hidden rounded-card border border-line bg-surface py-1 text-sm text-ink shadow-overlay';

export const MENU_ITEM =
  'flex cursor-pointer items-center gap-2 px-3 py-2 outline-none select-none focus:bg-surface-alt aria-expanded:bg-surface-alt';

export const MENU_SEPARATOR = 'my-1 h-px bg-line';

/**
 * Bouton ⋯ d'une ligne de la barre latérale : discret, il apparaît sur la ligne active, au survol et au focus du
 * clavier, et reste enfoncé tant que son menu est ouvert.
 */
export const SIDEBAR_TRIGGER =
  'grid size-6 shrink-0 place-items-center rounded-control text-nav-muted opacity-0 group-hover/nav:opacity-100 group-has-aria-current/nav:opacity-100 hover:text-nav-ink focus-visible:opacity-100 aria-expanded:bg-surface aria-expanded:text-nav-ink aria-expanded:opacity-100';
