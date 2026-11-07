import { create } from 'zustand';

/** Message bref (« Autorisé · Specs du tableau de bord »), retiré seul après quelques secondes. */
export interface Notice {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

interface NoticesState {
  dismiss: (id: number) => void;
  notices: Notice[];
  push: (text: string, tone?: Notice['tone']) => void;
}

const NOTICE_MS = 5000;
let next = 0;

export const useNotices = create<NoticesState>()((set, get) => ({
  notices: [],
  dismiss: (id) => set({ notices: get().notices.filter((notice) => notice.id !== id) }),
  push: (text, tone = 'info') => {
    const id = ++next;
    set({ notices: [...get().notices, { id, text, tone }] });
    setTimeout(() => get().dismiss(id), NOTICE_MS);
  },
}));

/** Ce que dit Bosco quand une autorisation a reçu sa réponse, ici ou dans le terminal (CA-SESS-07, CA-SESS-36). */
export function settledNotice(
  outcome: 'allowed' | 'denied' | 'elsewhere',
  title: string,
): Pick<Notice, 'text' | 'tone'> {
  if (outcome === 'allowed') return { text: `Autorisé · ${title}`, tone: 'success' };
  if (outcome === 'denied') return { text: `Refusé · ${title}`, tone: 'info' };
  return { text: `Répondu dans le terminal · ${title}`, tone: 'info' };
}
