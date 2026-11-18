'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { UpdateNotice } from '@/features/about/components/update-notice';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { NotificationsLive } from '@/features/notifications/components/notifications-live';
import { ProjectActionsProvider } from '@/features/projects/components/project-actions';
import { ContainersDock } from '@/features/sandbox/components/containers-dock';
import { ContainersSummary } from '@/features/sandbox/components/containers-summary';
import { SourcesStatus } from '@/features/sessions/components/sidebar-status';
import { ShellSlotsProvider } from '@/shared/layouts/app-shell';
import { AppSidebar } from './app-sidebar';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <NotificationsLive />
      <ShellSlotsProvider
        banner={<UpdateNotice />}
        bell={<NotificationBell />}
        containers={<ContainersSummary />}
        dock={<ContainersDock />}
        sidebar={<AppSidebar />}
        status={<SourcesStatus />}
      >
        <ProjectActionsProvider>{children}</ProjectActionsProvider>
      </ShellSlotsProvider>
    </QueryClientProvider>
  );
}
