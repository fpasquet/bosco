'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { NotificationsLive } from '@/features/notifications/components/notifications-live';
import { ShellSlotsProvider } from '@/shared/layouts/app-shell';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <NotificationsLive />
      <ShellSlotsProvider bell={<NotificationBell />}>{children}</ShellSlotsProvider>
    </QueryClientProvider>
  );
}
