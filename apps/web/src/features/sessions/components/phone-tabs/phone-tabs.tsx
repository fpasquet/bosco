import { cn } from '@/lib/cn';

/**
 * Onglet du détail sur le téléphone : le fil, les projets d'une session à plusieurs projets, son bac à sable,
 * l'usage.
 */
export type PhoneTab = 'feed' | 'projects' | 'sandbox' | 'usage';

const LABELS: Record<PhoneTab, string> = { feed: 'Fil', projects: 'Projets', sandbox: 'Bac à sable', usage: 'Usage' };

/** Onglets d'une session : « Projets » quand elle en a plusieurs, « Bac à sable » quand elle tourne dans un bac à sable. */
export function phoneTabsOf(several: boolean, sandboxed = false): PhoneTab[] {
  return ['feed', ...(several ? (['projects'] as const) : []), ...(sandboxed ? (['sandbox'] as const) : []), 'usage'];
}

/** Onglet ouvert sur le téléphone, le fil si l'onglet choisi n'existe pas ; null sur le poste, sans onglets. */
export function openTab(phone: boolean, chosen: PhoneTab, tabs: readonly PhoneTab[]): null | PhoneTab {
  if (!phone) return null;
  return tabs.includes(chosen) ? chosen : 'feed';
}

/** Attributs du volet d'un onglet, sur le téléphone seulement. */
export function tabPanel(shown: null | PhoneTab, name: PhoneTab) {
  return shown ? { role: 'tabpanel', id: `session-panel-${name}`, 'aria-labelledby': `session-tab-${name}` } : {};
}

/** Barre d'onglets du détail sur le téléphone, qui remplace la colonne de droite. */
export function PhoneTabs({
  current,
  onChange,
  tabs,
}: {
  current: PhoneTab;
  onChange: (tab: PhoneTab) => void;
  tabs: readonly PhoneTab[];
}) {
  return (
    <div role="tablist" aria-label="Volets de la session" className="tabs tabs-border w-full border-b border-line">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`session-tab-${tab}`}
          // Seul le volet de l'onglet ouvert est rendu : les autres onglets ne désignent rien
          aria-controls={current === tab ? `session-panel-${tab}` : undefined}
          aria-selected={current === tab}
          className={cn('tab flex-1', current !== tab && 'text-muted opacity-100')}
          onClick={() => onChange(tab)}
        >
          {LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
