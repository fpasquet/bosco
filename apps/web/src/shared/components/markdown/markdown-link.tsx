import type { ComponentProps } from 'react';
import type { ExtraProps } from 'streamdown';

/** Lien d'une réponse : ouvert dans un nouvel onglet, sans transmettre la page d'origine. */
export function MarkdownLink({ children, href, node: _node }: ComponentProps<'a'> & ExtraProps) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link link-primary">
      {children}
    </a>
  );
}
