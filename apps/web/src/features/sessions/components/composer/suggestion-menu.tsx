'use client';
import type { SuggestionPositionData } from '@tiptap/suggestion';
import { type CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SuggestionMenuState } from './composer-controller';
import { SuggestionOption } from './suggestion-option';

export interface SuggestionMenuProps {
  /** Préfixe des identifiants (liste, options, titre), relus par le champ (aria-controls, aria-activedescendant) */
  baseId: string;
  menu: SuggestionMenuState;
  /** Accroche le menu au curseur ; renvoie de quoi le décrocher */
  mount: (element: HTMLElement, onPosition: (data: SuggestionPositionData) => void) => () => void;
  onChoose: (index: number) => void;
  /** Téléphone : une feuille au-dessus de la zone plutôt qu'un menu au curseur */
  phone: boolean;
}

const TITLE = { command: 'Commandes et skills', file: 'Fichiers du dépôt' };
const EMPTY = { command: 'Aucune commande ne correspond', file: 'Aucun fichier ne correspond' };

export const listIdOf = (baseId: string) => `${baseId}-list`;
export const optionIdOf = (baseId: string, index: number) => `${baseId}-option-${index}`;

/** Menu des suggestions de « @ » et « / » : une liste d'options (listbox) pilotée depuis le champ. */
export function SuggestionMenu({ baseId, menu, mount, onChoose, phone }: SuggestionMenuProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<null | SuggestionPositionData>(null);
  const { activeIndex, items, kind, loading, openId, query } = menu;

  // Accroché une fois par ouverture ; sur téléphone, seule la fermeture au clic en dehors sert
  useEffect(() => {
    if (!element) return;
    return mount(element, phone ? () => undefined : setPosition);
  }, [element, mount, openId, phone]);

  useEffect(() => {
    document.getElementById(optionIdOf(baseId, activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, baseId]);

  const titleId = `${baseId}-title`;
  const content = (
    <>
      <p id={titleId} className="border-b border-line px-3 py-2 text-xs font-semibold text-muted max-md:border-b-0">
        {TITLE[kind]}
      </p>
      {items.length > 0 ? (
        <div
          id={listIdOf(baseId)}
          role="listbox"
          aria-labelledby={titleId}
          aria-busy={loading}
          className="max-h-64 overflow-y-auto py-1"
        >
          {items.map((item, index) => (
            <SuggestionOption
              key={item.value}
              id={optionIdOf(baseId, index)}
              active={index === activeIndex}
              item={item}
              kind={kind}
              query={query}
              onChoose={() => onChoose(index)}
            />
          ))}
        </div>
      ) : (
        <p role="status" className="px-3 py-2 text-xs text-muted">
          {loading ? 'Recherche…' : EMPTY[kind]}
        </p>
      )}
    </>
  );

  if (phone)
    return (
      <div
        ref={setElement}
        className="absolute inset-x-0 bottom-full z-10 rounded-t-2xl border-t border-line bg-surface pb-2 shadow-overlay"
      >
        <div aria-hidden className="grid h-5 place-items-center">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        {content}
      </div>
    );

  const style: CSSProperties = position
    ? { position: position.strategy, left: position.x, top: position.y }
    : { position: 'fixed', left: 0, top: 0, visibility: 'hidden' };
  // Hors du flux, pour ne pas être coupé par une zone qui défile (le fil de la session)
  return createPortal(
    <div
      ref={setElement}
      style={style}
      className="z-50 w-md overflow-hidden rounded-card border border-line bg-surface shadow-overlay"
    >
      {content}
      <p className="border-t border-line px-3 py-2 text-xs text-muted">
        <kbd className="kbd kbd-xs">↑</kbd>
        <kbd className="kbd kbd-xs">↓</kbd> pour choisir · <kbd className="kbd kbd-xs">Entrée</kbd> pour insérer ·{' '}
        <kbd className="kbd kbd-xs">Échap</kbd> pour fermer
      </p>
    </div>,
    document.body,
  );
}
