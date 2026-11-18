/** Classes partagées par les menus ⋯ d'un projet et d'un groupe ; celles du menu viennent du design system. */
export { MENU_CONTENT, MENU_ITEM, MENU_SEPARATOR } from '@/shared/ui/menu';

/**
 * Bouton ⋯ d'une ligne de la barre latérale : discret, il apparaît sur la ligne active, au survol et au focus du
 * clavier, et reste enfoncé tant que son menu est ouvert.
 */
export const SIDEBAR_TRIGGER =
  'grid size-6 shrink-0 place-items-center rounded-control text-nav-muted opacity-0 group-hover/nav:opacity-100 group-has-aria-current/nav:opacity-100 hover:text-nav-ink focus-visible:opacity-100 aria-expanded:bg-surface aria-expanded:text-nav-ink aria-expanded:opacity-100';
