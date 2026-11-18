import { BookOpen, FolderTree, History, LayoutDashboard, type LucideIcon, Radar, Settings } from 'lucide-react';

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Libellé court des onglets du téléphone ; absent : l'entrée n'y figure pas (on configure sur le poste). */
  mobileLabel?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Vue d’ensemble', mobileLabel: 'Ensemble', icon: LayoutDashboard },
  { href: '/history', label: 'Historique', mobileLabel: 'Historique', icon: History },
  { href: '/projects', label: 'Tous les projets', mobileLabel: 'Projets', icon: FolderTree },
  { href: '/context', label: 'Contexte', icon: BookOpen },
  { href: '/sources', label: 'Sources', mobileLabel: 'Sources', icon: Radar },
  { href: '/settings', label: 'Réglages', icon: Settings },
];
