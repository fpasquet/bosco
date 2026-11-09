'use client';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * Ce que l'application place dans la coquille sans que la coquille le connaisse : la cloche des notifications (E15a),
 * le résumé des conteneurs en bas de la barre latérale et leur panneau en bas de page (E19a).
 */
interface Slots {
  bell: ReactNode;
  containers: ReactNode;
  dock: ReactNode;
}

const ShellSlots = createContext<Slots>({ bell: null, containers: null, dock: null });

export function ShellSlotsProvider({ children, ...slots }: Partial<Slots> & { children: ReactNode }) {
  return (
    <ShellSlots.Provider
      value={{ bell: slots.bell ?? null, containers: slots.containers ?? null, dock: slots.dock ?? null }}
    >
      {children}
    </ShellSlots.Provider>
  );
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
