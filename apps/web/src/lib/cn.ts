import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Les pas d'espacement nommés par les tokens (h-control, h-row) : sans eux, tailwind-merge les confondrait
const twMerge = extendTailwindMerge({ extend: { theme: { spacing: ['control', 'row'] } } });

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
