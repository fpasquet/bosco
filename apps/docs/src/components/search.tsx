'use client';

import type { SharedProps } from 'fumadocs-ui/contexts/search';
import { useStaticSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
} from 'fumadocs-ui/components/dialog/search';
import { BASE_PATH } from '@/lib/constants';

// Site statique : l'index de recherche est exporté au build (app/api/search), puis interrogé dans le navigateur
export default function StaticSearchDialog(props: SharedProps) {
  const search = useStaticSearch({ from: `${BASE_PATH}/api/search` });

  return (
    <SearchDialog {...search} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList />
      </SearchDialogContent>
    </SearchDialog>
  );
}
