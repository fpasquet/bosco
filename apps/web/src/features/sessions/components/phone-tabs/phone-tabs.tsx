import { cn } from '@/lib/cn';

/** Onglet du détail sur le téléphone : le fil, les projets d'une session à plusieurs projets, l'usage. */
export type PhoneTab = 'feed' | 'projects' | 'usage';

const LABELS: Record<PhoneTab, string> = { feed: 'Fil', projects: 'Projets', usage: 'Usage' };

/** Onglets d'une session : « Projets » seulement quand elle en a plusieurs. */
export function phoneTabsOf(several: boolean): PhoneTab[] {
  return several ? ['feed', 'projects', 'usage'] : ['feed', 'usage'];
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
