'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { notificationSettingsQuery, updateNotificationSettings } from '../../api/settings';
import { NotificationSettings } from './notification-settings';

/** Réglages › Notifications ; en lecture seule sur le téléphone. */
export function NotificationSettingsScreen() {
  const client = useQueryClient();
  const { data } = useQuery(notificationSettingsQuery);
  const save = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (settings) => client.setQueryData(notificationSettingsQuery.queryKey, settings),
  });
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader
        current="notifications"
        aside={
          <span className="ml-auto hidden h-control items-center gap-2 rounded-control border border-line bg-surface px-3 text-muted md:inline-flex">
            <Lock aria-hidden className="size-4" />
            Réservé à toi
          </span>
        }
      />
      {data ? (
        <NotificationSettings
          settings={data.notifications}
          desktop={data.desktopNotifications}
          busy={save.isPending}
          onChange={({ desktop, notifications }) =>
            save.mutate({
              ...(desktop !== undefined && { desktopNotifications: desktop }),
              ...(notifications && { notifications }),
            })
          }
        />
      ) : (
        <SectionSkeleton rows={6} />
      )}
      <p className="text-xs text-muted md:hidden">Modifiable depuis le poste. Ces réglages sont réservés à toi.</p>
    </div>
  );
}
