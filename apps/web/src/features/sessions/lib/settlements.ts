import { create } from 'zustand';

/** Dernière réponse à une autorisation, par session : « Répondu ailleurs à 15:15 » sur la carte du détail (CA-SESS-33). */
export interface Settlement {
  at: string;
  outcome: 'allowed' | 'denied' | 'elsewhere';
}

interface SettlementsState {
  record: (sessionId: string, outcome: Settlement['outcome']) => void;
  settlements: Record<string, Settlement>;
}

export const useSettlements = create<SettlementsState>()((set, get) => ({
  settlements: {},
  record: (sessionId, outcome) =>
    set({ settlements: { ...get().settlements, [sessionId]: { outcome, at: new Date().toISOString() } } }),
}));
