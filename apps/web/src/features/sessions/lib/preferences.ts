import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SourcesPreferences {
  dismissLiveTrackingHint: () => void;
  /** Encart « Suivi en direct » masqué par « Plus tard » ; l'installation reste proposée dans les sources (CA-SESS-04). */
  liveTrackingHintDismissed: boolean;
}

export const useSourcesPreferences = create<SourcesPreferences>()(
  persist(
    (set) => ({
      liveTrackingHintDismissed: false,
      dismissLiveTrackingHint: () => set({ liveTrackingHintDismissed: true }),
    }),
    { name: 'bosco.sources' },
  ),
);
