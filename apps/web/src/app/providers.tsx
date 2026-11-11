'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { NotificationsLive } from '@/features/notifications/components/notifications-live';
import { ContainersDock } from '@/features/tasks/components/containers-dock';
import { ContainersSummary } from '@/features/tasks/components/containers-summary';
import { ShellSlotsProvider } from '@/shared/layouts/app-shell';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <NotificationsLive />
      <ShellSlotsProvider bell={<NotificationBell />} containers={<ContainersSummary />} dock={<ContainersDock />}>
        {children}
      </ShellSlotsProvider>
    </QueryClientProvider>
  );
}
