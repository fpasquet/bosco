import { create } from 'zustand';

/** Le tiroir des notifications, unique, que chaque cloche ouvre (E15a). */
export const useNotificationsDrawer = create<{ open: boolean; setOpen: (open: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
