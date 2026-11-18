'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import {
  isolationQuery,
  IsolationRefused,
  profilesQuery,
  quotaQuery,
  QuotaRefused,
  setQuotaScope,
  setQuotaThresholds,
  setSubscription,
} from '../../api/isolation';
import { QuotaPanel } from '../quota-panel';
import { SubscriptionPanel } from '../subscription-panel';

/**
 * Réglages › Abonnement Claude : l'abonnement par défaut des nouvelles sessions, l'usage de chaque abonnement et
 * les seuils du quota. Sur le téléphone, tout se lit sans se changer.
 */
export function SubscriptionScreen() {
  const client = useQueryClient();
  const phone = useIsPhone();
  const { data: isolation } = useQuery(isolationQuery);
  const { data: quota } = useQuery(quotaQuery);
  const { data: profiles } = useQuery(profilesQuery);
  const profile = profiles?.sources.find(({ path }) => path === isolation?.subscription.profile);
  const [subscriptionError, setSubscriptionError] = useState<null | string>(null);
  const [quotaError, setQuotaError] = useState<null | string>(null);
  const subscription = useMutation({
    mutationFn: setSubscription,
    onSuccess: (next) => {
      setSubscriptionError(null);
      client.setQueryData(isolationQuery.queryKey, next);
    },
    onError: (failure) =>
      setSubscriptionError(
        failure instanceof IsolationRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.',
      ),
  });
  const savedQuota = {
    onSuccess: (next: Awaited<ReturnType<typeof setQuotaScope>>) => {
      setQuotaError(null);
      client.setQueryData(quotaQuery.queryKey, next);
    },
    onError: (failure: Error) =>
      setQuotaError(failure instanceof QuotaRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.'),
  };
  const thresholds = useMutation({ mutationFn: setQuotaThresholds, ...savedQuota });
  const scope = useMutation({ mutationFn: setQuotaScope, ...savedQuota });
  const busy = subscription.isPending || thresholds.isPending || scope.isPending;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="subscription" />
      {!isolation || !quota ? (
        <SectionSkeleton rows={4} />
      ) : (
        <>
          <SubscriptionPanel
            subscription={isolation.subscription}
            profileHref={profile ? `/settings/sources/${encodeURIComponent(profile.id)}` : null}
            busy={busy}
            error={subscriptionError}
            onChange={(profile) => subscription.mutate(profile)}
          />
          <QuotaPanel
            quota={quota}
            readOnly={phone}
            busy={busy}
            error={quotaError}
            onThresholds={(next) => thresholds.mutate(next)}
            onScope={(next) => scope.mutate(next)}
          />
        </>
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
