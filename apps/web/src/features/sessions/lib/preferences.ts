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

export type Grouping = 'group' | 'project' | 'state';

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
      grouping: 'project',
      hideInactive: false,
      setGrouping: (grouping) => set({ grouping }),
      toggleHideInactive: () => set((state) => ({ hideInactive: !state.hideInactive })),
    }),
    {
      name: 'bosco.overview',
      // Version 0 : le regroupement par projet s'appelait « repository » ; un choix gardé avant le renommage se relit
      version: 1,
      migrate: (stored, version) => {
        const state = stored as Omit<OverviewPreferences, 'grouping'> & { grouping: string };
        const grouping = version === 0 && state.grouping === 'repository' ? 'project' : (state.grouping as Grouping);
        return { ...state, grouping };
      },
    },
  ),
);
