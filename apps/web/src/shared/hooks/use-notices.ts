import { create } from 'zustand';

/** Action d'un message bref (« Annuler l'annulation », « Ouvrir »), proposée le temps qu'il reste affiché. */
export interface NoticeAction {
  label: string;
  run: () => void;
}

/** Message bref (« Autorisé · Specs du tableau de bord »), retiré seul après quelques secondes (E15c). */
export interface Notice {
  action?: NoticeAction;
  /** Durée d'affichage ; null : il reste jusqu'à ce qu'on le ferme ou qu'on suive son action (une question) */
  duration: null | number;
  id: number;
  /** Ligne d'extrait, sous le titre */
  line?: string;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

export interface NoticeOptions {
  line?: string;
  /** Il reste affiché jusqu'à ce qu'on le ferme : une question qui attend une réponse */
  persistent?: boolean;
}

interface NoticesState {
  dismiss: (id: number) => void;
  notices: Notice[];
  push: (text: string, tone?: Notice['tone'], action?: NoticeAction, options?: NoticeOptions) => void;
}

export const NOTICE_MS = 5000;
/** Un message qui propose une action reste plus longtemps, le temps de la lire et de cliquer */
export const ACTION_NOTICE_MS = 8000;
/** Trois messages au plus : un de plus fait partir le plus ancien */
export const MAX_NOTICES = 3;
let next = 0;

export const useNotices = create<NoticesState>()((set, get) => ({
  notices: [],
  dismiss: (id) => set({ notices: get().notices.filter((notice) => notice.id !== id) }),
  push: (text, tone = 'info', action, options = {}) => {
    const id = ++next;
    let duration: null | number = action ? ACTION_NOTICE_MS : NOTICE_MS;
    if (options.persistent) duration = null;
    const notice: Notice = { action, duration, id, line: options.line, text, tone };
    set({ notices: [...get().notices, notice].slice(-MAX_NOTICES) });
  },
}));
