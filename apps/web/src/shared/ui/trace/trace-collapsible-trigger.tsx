import { ChevronRightIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { CollapsibleTrigger } from '@/shared/ui/collapsible';
import { TraceIcon } from './trace-icon';

export function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleTrigger>, 'asChild'>) {
  return (
    <CollapsibleTrigger className={cn('trace-collapsible-trigger', className)} {...props}>
      {children}
      <TraceIcon className="trace-chevron">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  );
}
