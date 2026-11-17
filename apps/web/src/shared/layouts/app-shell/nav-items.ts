import { FolderGit2, History, LayoutDashboard, type LucideIcon, Settings } from 'lucide-react';

/** Place de la page ouverte : elle choisit l'entrée active de la barre latérale et de l'onglet du bas. */
export type ShellPlace =
  | { id: number; kind: 'group' }
  | { id: number; kind: 'project' }
  | { kind: 'history' }
  | { kind: 'other' }
  | { kind: 'overview' }
  | { kind: 'projects' }
  | { kind: 'settings' };

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Places qui rendent l'entrée active */
  places: readonly ShellPlace['kind'][];
}

/** Haut de la barre latérale : les pages de premier niveau. « Réglages » est en pied. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Vue d’ensemble', icon: LayoutDashboard, places: ['overview'] },
  { href: '/history', label: 'Historique', icon: History, places: ['history'] },
];

export const SETTINGS_ITEM: NavItem = { href: '/settings', label: 'Réglages', icon: Settings, places: ['settings'] };

/** Onglets du bas du téléphone : les projets et les groupes s'ouvrent depuis « Projets ». */
export const MOBILE_TABS: readonly NavItem[] = [
  { href: '/', label: 'Ensemble', icon: LayoutDashboard, places: ['overview'] },
  { href: '/history', label: 'Historique', icon: History, places: ['history'] },
  { href: '/projects', label: 'Projets', icon: FolderGit2, places: ['projects', 'project', 'group'] },
  // Sur le téléphone, la racine des Réglages est l'onglet Sources, suivi des autres onglets
  { href: '/settings/sources', label: 'Réglages', icon: Settings, places: ['settings'] },
];
