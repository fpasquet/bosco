'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  /** Libellé plus court sur le téléphone (« Tout » pour « Depuis le début ») */
  short?: ReactNode;
  label: ReactNode;
  value: T;
}

export interface SegmentedProps<T extends string> {
  className?: string;
  /** Nom du groupe pour les lecteurs d'écran */
  label: string;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  value: T;
}

/** Choix exclusif en boutons accolés (« 7 j | 30 j | 90 j »), l'option choisie étant pressée. */
export function Segmented<T extends string>({ className, label, onChange, options, value }: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex w-fit shrink-0 rounded-control bg-surface-alt p-0.5 text-xs text-muted', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className="rounded-control px-2.5 py-1.5 whitespace-nowrap aria-pressed:bg-surface aria-pressed:font-medium aria-pressed:text-ink aria-pressed:shadow-card"
        >
          {option.short ? (
            <>
              <span className="md:hidden">{option.short}</span>
              <span className="hidden md:inline">{option.label}</span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
