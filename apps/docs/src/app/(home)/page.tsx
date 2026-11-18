import { BellRing, Box, FolderTree, History, type LucideIcon, MonitorSmartphone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { DOCS_BASE_PATH, SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

interface Feature {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
}

const FEATURES: Feature[] = [
  {
    description:
      'Toutes les sessions Claude Code du poste, rangées par projet et par groupe, avec leur état en direct. Celle qui attend une réponse passe devant.',
    href: `${DOCS_BASE_PATH}/guides/sessions`,
    icon: BellRing,
    title: 'Voir celle qui vous attend',
  },
  {
    description:
      'Une commande demande votre accord : « Autoriser » ou « Refuser » depuis Bosco, le navigateur, la barre système ou le téléphone, sans revenir au terminal.',
    href: `${DOCS_BASE_PATH}/guides/sessions#autoriser-ou-refuser`,
    icon: ShieldCheck,
    title: 'Autoriser sans changer de fenêtre',
  },
  {
    description:
      'Lancer une session depuis Bosco, lui écrire, choisir son mode d’autorisation et son modèle, sur un ou plusieurs projets.',
    href: `${DOCS_BASE_PATH}/guides/piloted-sessions`,
    icon: MonitorSmartphone,
    title: 'Piloter une session',
  },
  {
    description:
      'Une session pilotée tourne dans un conteneur, isolée du poste, sur sa propre branche, avec un réseau fermé aux seuls domaines permis.',
    href: `${DOCS_BASE_PATH}/guides/sandbox`,
    icon: Box,
    title: 'Bac à sable',
  },
  {
    description:
      'Des projets choisis dans un navigateur de dossiers, réunis en groupes avec leurs instructions, et un contexte envoyé à chaque session.',
    href: `${DOCS_BASE_PATH}/guides/projects-and-groups`,
    icon: FolderTree,
    title: 'Projets et groupes',
  },
  {
    description:
      'Retrouver une session passée, puis voir la consommation par jour, par projet, par groupe et par modèle.',
    href: `${DOCS_BASE_PATH}/guides/history-and-usage`,
    icon: History,
    title: 'Historique et usage',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-16 md:py-24">
      <section className="flex flex-col items-start gap-6">
        <p className="text-sm font-semibold tracking-widest text-fd-primary uppercase">{SITE_TAGLINE}</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {SITE_NAME}, le maître d&apos;équipage de vos sessions Claude Code
        </h1>
        <p className="max-w-3xl text-lg text-fd-muted-foreground">
          {SITE_NAME} tourne sur votre poste. Il découvre les sessions Claude Code lancées dans vos terminaux, dit
          laquelle attend une réponse, laisse autoriser une commande sans changer de fenêtre, et fait tourner une
          session dans un bac à sable, isolée du poste, sur sa propre branche.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground"
            href={`${DOCS_BASE_PATH}/installation`}
          >
            Installer {SITE_NAME}
          </Link>
          <Link
            className="rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-semibold"
            href={DOCS_BASE_PATH}
          >
            Lire la présentation
          </Link>
        </div>
      </section>
      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ description, href, icon: Icon, title }) => (
          <Link
            className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
            href={href}
            key={title}
          >
            <Icon aria-hidden="true" className="size-5 text-fd-primary" />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-fd-muted-foreground">{description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
