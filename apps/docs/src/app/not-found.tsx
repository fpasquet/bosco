import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import { DOCS_BASE_PATH } from '@/lib/constants';
import { baseOptions } from '@/lib/layout';

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions}>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest text-fd-primary uppercase">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Cette page n&apos;existe pas</h1>
        <Link
          className="mt-8 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground"
          href={DOCS_BASE_PATH}
        >
          Lire la documentation
        </Link>
      </main>
    </HomeLayout>
  );
}
