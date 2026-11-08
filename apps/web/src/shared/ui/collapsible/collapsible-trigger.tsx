import type * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

export function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger {...props} />;
}
