'use client';
import { ArrowUpCircle, PartyPopper, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { APP_NAME } from '@bosco/domain';

export type UpdateBannerNotice =
  | { download: null | { label: string; url: string }; kind: 'available'; version: string }
  | { kind: 'installed'; version: string };

export interface UpdateBannerProps {
  notice: UpdateBannerNotice;
  onDismiss: () => void;
}

/**
 * Bandeau en haut de la page : « Bosco 0.3.0 installé », une fois après une mise à jour, ou « Version 0.3.0
 * disponible » ; chacun mène aux nouveautés de Réglages › À propos et se ferme.
 */
export function UpdateBanner({ notice, onDismiss }: UpdateBannerProps) {
  const installed = notice.kind === 'installed';
  const Icon = installed ? PartyPopper : ArrowUpCircle;
  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-primary-soft px-4 py-2 text-sm"
    >
      <Icon aria-hidden className="size-4 shrink-0 text-primary" />
      <p className="font-medium">
        {installed ? `${APP_NAME} ${notice.version} installé` : `Version ${notice.version} disponible`}
      </p>
      <Link
        href={installed ? '/settings/about#nouveautes' : '/settings/about#disponible'}
        className="text-primary underline-offset-2 focus-ring hover:underline"
        onClick={onDismiss}
      >
        Voir les nouveautés
      </Link>
      {notice.kind === 'available' && notice.download && (
        <a href={notice.download.url} className="text-primary underline-offset-2 focus-ring hover:underline">
          {notice.download.label}
        </a>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto text-muted"
        aria-label="Fermer le bandeau"
        onClick={onDismiss}
      >
        <X aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
