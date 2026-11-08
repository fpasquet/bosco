import { create } from 'zustand';

/** Action d'un message bref (« Annuler l'annulation »), proposée le temps qu'il reste affiché. */
export interface NoticeAction {
  label: string;
  run: () => void;
}

/** Message bref (« Autorisé · Specs du tableau de bord »), retiré seul après quelques secondes. */
export interface Notice {
  action?: NoticeAction;
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

interface NoticesState {
  dismiss: (id: number) => void;
  notices: Notice[];
  push: (text: string, tone?: Notice['tone'], action?: NoticeAction) => void;
}

const NOTICE_MS = 5000;
/** Un message qui propose une action reste plus longtemps, le temps de la lire et de cliquer */
export const ACTION_NOTICE_MS = 8000;
let next = 0;

export const useNotices = create<NoticesState>()((set, get) => ({
  notices: [],
  dismiss: (id) => set({ notices: get().notices.filter((notice) => notice.id !== id) }),
  push: (text, tone = 'info', action) => {
    const id = ++next;
    set({ notices: [...get().notices, { action, id, text, tone }] });
    setTimeout(() => get().dismiss(id), action ? ACTION_NOTICE_MS : NOTICE_MS);
  },
}));
