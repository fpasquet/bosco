'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { aboutQuery, dismissNotice } from '../../api/about';
import { downloadOf } from '../../lib/version';
import { UpdateBanner, type UpdateBannerNotice } from '../update-banner';

/** La version disponible se relit toutes les heures : le service ne cherche qu'une fois par jour */
const REFRESH_MS = 60 * 60 * 1000;

/**
 * Le bandeau de la coquille : « Bosco X installé » une fois après une mise à jour, sinon l'avis d'une version
 * disponible tant qu'il n'a pas été fermé. Rien sur Réglages › À propos, qui montre déjà tout.
 */
export function UpdateNotice() {
  const phone = useIsPhone();
  const pathname = usePathname();
  const client = useQueryClient();
  const { data } = useQuery({ ...aboutQuery, refetchInterval: REFRESH_MS });
  const dismiss = useMutation({
    mutationFn: ({ kind, version }: UpdateBannerNotice) => dismissNotice(kind, version),
    onSuccess: (saved) => client.setQueryData(aboutQuery.queryKey, saved),
  });
  if (!data || pathname === '/settings/about') return null;
  let notice: null | UpdateBannerNotice = null;
  if (data.installed) notice = { kind: 'installed', version: data.installed };
  else if (data.updates.available && !data.updates.dismissed) {
    const { available } = data.updates;
    notice = {
      kind: 'available',
      version: available.version,
      download: downloadOf(available, { install: data.install, phone }),
    };
  }
  if (!notice) return null;
  const shown = notice;
  return <UpdateBanner notice={shown} onDismiss={() => dismiss.mutate(shown)} />;
}
