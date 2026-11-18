'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_FILTERS, filtersOf, searchOf, type UsageFilters } from '../lib/filters';

interface StoredFilters {
  filters: UsageFilters;
  remember: (filters: UsageFilters) => void;
}

/** Derniers filtres de la page Usage : l'appareil s'en souvient d'une visite à l'autre. */
const useStoredFilters = create<StoredFilters>()(
  persist((set) => ({ filters: DEFAULT_FILTERS, remember: (filters) => set({ filters }) }), {
    name: 'bosco.usage-filters',
  }),
);

/**
 * Filtres de la page Usage, gardés dans l'adresse : un lien (« Usage » du menu ⋯ d'un groupe) ouvre la page déjà
 * filtrée. Sans filtre dans l'adresse, la page reprend ceux de la dernière visite.
 */
export function useUsageFilters(): [UsageFilters, (filters: UsageFilters) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stored = useStoredFilters((state) => state.filters);
  const remember = useStoredFilters((state) => state.remember);
  const filters = filtersOf(new URLSearchParams(params.toString()));
  const empty = params.toString() === '';
  const restore = empty ? searchOf(stored) : '';
  useEffect(() => {
    if (restore) router.replace(`${pathname}${restore}`);
    else if (!empty) remember(filtersOf(new URLSearchParams(params.toString())));
  }, [empty, params, pathname, remember, restore, router]);
  const change = (next: UsageFilters) => {
    remember(next);
    router.replace(`${pathname}${searchOf(next)}`);
  };
  return [filters, change];
}
