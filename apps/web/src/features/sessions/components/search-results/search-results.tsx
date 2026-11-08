import type { Source } from '../../lib/conversation';
import { hostOf } from '../../lib/conversation';

/** Résultats d'une recherche web (Chain of Thought) : un badge par site, qui ouvre la page trouvée. */
export function SearchResults({ links }: { links: Source[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            title={link.title ?? link.url}
            className="badge badge-soft badge-sm hover:underline"
          >
            {hostOf(link.url)}
            <span className="sr-only"> (s’ouvre dans un nouvel onglet)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
