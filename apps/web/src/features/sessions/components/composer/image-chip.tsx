import { X } from 'lucide-react';
import Image from 'next/image';
import type { PilotImageDto } from '@bosco/domain';

export interface ImageChipProps {
  disabled?: boolean;
  image: PilotImageDto;
  onRemove: () => void;
}

/** Image jointe au message : vignette, nom et croix pour la retirer. */
export function ImageChip({ disabled = false, image, onRemove }: ImageChipProps) {
  return (
    <span className="inline-flex h-8 max-w-full items-center gap-2 rounded-control border border-line bg-surface-alt px-1">
      <Image
        src={`data:${image.mediaType};base64,${image.data}`}
        alt=""
        width={24}
        height={24}
        unoptimized
        className="size-6 shrink-0 rounded-sm object-cover"
      />
      <span className="truncate font-mono text-xs">{image.name}</span>
      <button
        type="button"
        aria-label={`Retirer ${image.name}`}
        disabled={disabled}
        className="btn btn-circle btn-ghost text-muted btn-xs"
        onClick={onRemove}
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}
