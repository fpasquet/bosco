import type { ComponentProps, ElementType } from 'react';
import type { ExtraProps } from 'streamdown';

/**
 * Élément du Markdown rendu sans les classes de Streamdown : celles que le projet compile aussi (text-3xl…)
 * l'emporteraient sur la mise en forme de la classe markdown.
 */
export function plainElement(
  tag:
    | 'blockquote'
    | 'em'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'hr'
    | 'li'
    | 'ol'
    | 'p'
    | 'strong'
    | 'table'
    | 'tbody'
    | 'td'
    | 'th'
    | 'thead'
    | 'tr'
    | 'ul',
) {
  const Element: ElementType = tag;
  function MarkdownElement({ className: _className, node: _node, ...props }: ComponentProps<'div'> & ExtraProps) {
    return <Element {...props} />;
  }
  MarkdownElement.displayName = `Markdown(${tag})`;
  return MarkdownElement;
}
