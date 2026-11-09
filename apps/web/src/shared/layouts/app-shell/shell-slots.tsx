'use client';
import { createContext, type ReactNode, useContext } from 'react';

/** Ce que l'application place dans la coquille sans que la coquille le connaisse : la cloche des notifications (E15a). */
const ShellSlots = createContext<{ bell: ReactNode }>({ bell: null });

export function ShellSlotsProvider({ bell, children }: { bell: ReactNode; children: ReactNode }) {
  return <ShellSlots.Provider value={{ bell }}>{children}</ShellSlots.Provider>;
}

export function ShellBell() {
  return useContext(ShellSlots).bell;
}
