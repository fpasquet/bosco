import * as React from 'react';
import { cn } from '@/lib/cn';
import { CollapsibleContent } from '@/shared/ui/collapsible';

export function TraceCollapsibleContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsibleContent>, 'asChild'>) {
  return (
    <CollapsibleContent className="trace-panel" {...props}>
      <div className={cn('trace-body', className)}>{children}</div>
    </CollapsibleContent>
  );
}
