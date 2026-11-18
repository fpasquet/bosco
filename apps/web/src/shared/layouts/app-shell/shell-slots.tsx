'use client';
import { createContext, type ReactNode, useContext } from 'react';
import type { ShellPlace } from './nav-items';

/**
 * Ce que l'application place dans la coquille sans que la coquille le connaisse : la cloche des notifications (E15a),
 * les groupes, projets et profils de la barre latérale, l'état des sources en pied, le résumé des conteneurs et leur
 * panneau en bas de page.
 */
interface Slots {
  bell: ReactNode;
  containers: ReactNode;
  dock: ReactNode;
  sidebar: ReactNode;
  status: ReactNode;
}

const EMPTY: Slots = { bell: null, containers: null, dock: null, sidebar: null, status: null };

const ShellSlots = createContext<Slots>(EMPTY);
const Place = createContext<ShellPlace>({ kind: 'other' });

export function ShellSlotsProvider({ children, ...slots }: Partial<Slots> & { children: ReactNode }) {
  return <ShellSlots.Provider value={{ ...EMPTY, ...slots }}>{children}</ShellSlots.Provider>;
}

/** Place de la page, donnée par la coquille à ce qu'elle contient. */
export function ShellPlaceProvider({ children, place }: { children: ReactNode; place: ShellPlace }) {
  return <Place.Provider value={place}>{children}</Place.Provider>;
}

export function useShellPlace(): ShellPlace {
  return useContext(Place);
}

export function ShellBell() {
  return useContext(ShellSlots).bell;
}

export function ShellContainers() {
  return useContext(ShellSlots).containers;
}

export function ShellDock() {
  return useContext(ShellSlots).dock;
}

export function ShellSidebar() {
  return useContext(ShellSlots).sidebar;
}

export function ShellStatus() {
  return useContext(ShellSlots).status;
}
