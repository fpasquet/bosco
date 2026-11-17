import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FolderBrowserPreferences {
  /** Dernier dossier ouvert dans le navigateur ; null : le dossier personnel */
  lastFolder: null | string;
  openFolder: (path: null | string) => void;
}

/** Le navigateur de dossiers rouvre le dernier dossier ouvert, d'une visite à l'autre. */
export const useFolderBrowserPreferences = create<FolderBrowserPreferences>()(
  persist(
    (set) => ({
      lastFolder: null,
      openFolder: (lastFolder) => set({ lastFolder }),
    }),
    { name: 'bosco.folder-browser' },
  ),
);
