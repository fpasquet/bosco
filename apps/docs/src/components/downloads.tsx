import { Download, ExternalLink, Package, Smartphone } from 'lucide-react';
import { LATEST_RELEASE_URL, latestReleases, type Release, type ReleaseFile, RELEASES_URL } from '@/lib/releases';

const SIZE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function megabytes(bytes: number): string {
  return `${SIZE.format(bytes / 1_000_000)} Mo`;
}

interface Choice {
  description: string;
  file: null | ReleaseFile;
  icon: typeof Package;
  title: string;
}

function choicesOf({ files }: Release): Choice[] {
  return [
    {
      description: 'Recommandé : garde le bac à sable de Chromium. Bosco signale chaque nouvelle version.',
      file: files.deb,
      icon: Package,
      title: 'Linux · paquet .deb',
    },
    {
      description: 'Sans installation, se met à jour toute seule. Se lance sans le bac à sable de Chromium.',
      file: files.appImage,
      icon: Download,
      title: 'Linux · AppImage',
    },
    {
      description: 'Hors Play Store, signé avec la clé de release. Se relie au poste par QR code.',
      file: files.apk,
      icon: Smartphone,
      title: 'Android · APK',
    },
  ];
}

function ReleaseCard({ release }: { release: Release }) {
  return (
    <section className="not-prose my-6 rounded-xl border border-fd-border bg-fd-card p-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-lg font-semibold">
          {release.prerelease ? 'Bêta' : 'Stable'} · {release.version}
        </h3>
        <p className="text-sm text-fd-muted-foreground">
          publiée le {DATE.format(new Date(release.publishedAt))} ·{' '}
          <a className="underline" href={release.url}>
            notes de version
          </a>
        </p>
      </header>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {choicesOf(release).map(({ description, file, icon: Icon, title }) => (
          <li className="flex flex-col gap-2 rounded-lg border border-fd-border p-4" key={title}>
            <span className="flex items-center gap-2 font-medium">
              <Icon aria-hidden="true" className="size-4 text-fd-primary" />
              {title}
            </span>
            <span className="text-sm text-fd-muted-foreground">{description}</span>
            {file ? (
              <a
                className="mt-auto rounded-lg bg-fd-primary px-3 py-2 text-center text-sm font-semibold text-fd-primary-foreground"
                download
                href={file.url}
              >
                Télécharger · {megabytes(file.size)}
              </a>
            ) : (
              <a className="mt-auto text-sm underline" href={release.url}>
                Absent de cette version : voir la release
              </a>
            )}
          </li>
        ))}
      </ul>
      {release.files.checksums && (
        <p className="mt-4 text-sm text-fd-muted-foreground">
          Sommes de contrôle :{' '}
          <a className="underline" href={release.files.checksums.url}>
            SHA256SUMS
          </a>
          . Dans le dossier du téléchargement, <code>sha256sum --check --ignore-missing SHA256SUMS</code> doit répondre
          « OK » pour chaque fichier.
        </p>
      )}
    </section>
  );
}

/**
 * Liens de téléchargement des applications, tirés des releases GitHub au build du site : la dernière version stable
 * et, si elle est plus récente, la dernière beta. Sans release lue, un lien vers la page des releases.
 */
export async function Downloads() {
  const { beta, stable } = await latestReleases();
  if (!beta && !stable) {
    return (
      <p className="not-prose my-6 rounded-xl border border-fd-border bg-fd-card p-5">
        Les fichiers de chaque version sont joints à sa release :{' '}
        <a className="inline-flex items-center gap-1 underline" href={LATEST_RELEASE_URL}>
          dernière version <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>{' '}
        ·{' '}
        <a className="underline" href={RELEASES_URL}>
          toutes les releases
        </a>
        .
      </p>
    );
  }
  return (
    <>
      {stable && <ReleaseCard release={stable} />}
      {beta && <ReleaseCard release={beta} />}
      {!stable && (
        <p className="not-prose text-sm text-fd-muted-foreground">
          Pas encore de version stable : seule la bêta est publiée.
        </p>
      )}
    </>
  );
}
