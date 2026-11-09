import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ContainersPanel {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/** Panneau des conteneurs déplié ou replié : il le reste d'une page à l'autre, et l'appareil s'en souvient (CA-CONT-71). */
export const useContainersPanel = create<ContainersPanel>()(
  persist(
    (set) => ({
      open: false,
      setOpen: (open) => set({ open }),
      toggle: () => set((state) => ({ open: !state.open })),
    }),
    { name: 'bosco.containers' },
  ),
);
