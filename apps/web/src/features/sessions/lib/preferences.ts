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

export type Grouping = 'repository' | 'state';

interface OverviewPreferences {
  grouping: Grouping;
  hideInactive: boolean;
  setGrouping: (grouping: Grouping) => void;
  toggleHideInactive: () => void;
}

/** Regroupement de la vue d'ensemble et masquage des inactives, gardés d'une visite à l'autre (CA-SESS-18). */
export const useOverviewPreferences = create<OverviewPreferences>()(
  persist(
    (set) => ({
      grouping: 'repository',
      hideInactive: false,
      setGrouping: (grouping) => set({ grouping }),
      toggleHideInactive: () => set((state) => ({ hideInactive: !state.hideInactive })),
    }),
    { name: 'bosco.overview' },
  ),
);
