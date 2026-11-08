import * as React from 'react';
import { cn } from '@/lib/cn';
import { Collapsible } from '@/shared/ui/collapsible';

export function TraceCollapsible({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Collapsible>, 'asChild' | 'open'> &
  (
    | { open?: undefined }
    | {
        open: boolean;
        onOpenChange: NonNullable<React.ComponentProps<typeof Collapsible>['onOpenChange']>;
      }
  )) {
  return <Collapsible className={cn('trace-collapsible', className)} {...props} />;
}
