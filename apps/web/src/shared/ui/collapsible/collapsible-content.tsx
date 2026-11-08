import type * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

export function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent {...props} />;
}
