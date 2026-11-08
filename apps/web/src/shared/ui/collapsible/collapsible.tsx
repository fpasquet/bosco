import type * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

export function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root {...props} />;
}
