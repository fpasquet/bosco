'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNotices } from '@/shared/hooks/use-notices';
import { groupsQuery } from '../../api/groups';
import { addProjects, folderQuery, ProjectRefused } from '../../api/projects';
import { useFolderBrowserPreferences } from '../../lib/last-folder';
import { addLabel, type ChosenFolder, toggleFolder } from '../../lib/selection';
import { FolderBrowser } from './folder-browser';

export interface FolderBrowserDialogProps {
  /** Groupe d'où la fenêtre est ouverte : il est choisi d'avance ; sinon « Aucun groupe » */
  group?: null | number;
  onClose: () => void;
  open: boolean;
}

/** Fenêtre « Ajouter des projets », reliée à Bosco : elle rouvre le dernier dossier ouvert. */
export function FolderBrowserDialog({ group = null, onClose, open }: FolderBrowserDialogProps) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { lastFolder, openFolder } = useFolderBrowserPreferences();
  const { control, reset, setValue } = useForm<{ chosen: ChosenFolder[]; group: null | number }>({
    defaultValues: { chosen: [], group },
  });
  const chosen = useWatch({ control, name: 'chosen' });
  const chosenGroup = useWatch({ control, name: 'group' });
  // « Tous les projets » réunit déjà tout : seuls les groupes qu'on règle se proposent
  const { data: groups } = useQuery({ ...groupsQuery, enabled: open });
  const choices = (groups ?? []).filter(({ system }) => !system).map(({ id, name }) => ({ id, name }));
  const [error, setError] = useState<null | string>(null);
  const listing = useQuery({ ...folderQuery(lastFolder), enabled: open });
  // Un dernier dossier qui n'existe plus ramène au dossier personnel
  useEffect(() => {
    if (listing.isError && lastFolder) openFolder(null);
  }, [listing.isError, lastFolder, openFolder]);
  const close = () => {
    reset();
    setError(null);
    onClose();
  };
  const add = useMutation({
    mutationFn: () =>
      addProjects(
        chosen.map(({ path }) => path),
        chosenGroup,
      ),
    onSuccess: async (projects) => {
      push(projects.length > 1 ? `${projects.length} projets ajoutés` : 'Projet ajouté', 'success');
      close();
      // Les sessions déjà lues de ces dossiers quittent « Hors projet » partout
      await client.invalidateQueries();
    },
    onError: (failure) =>
      setError(failure instanceof ProjectRefused ? failure.message : `« ${addLabel(chosen.length)} » a échoué.`),
  });
  return (
    <FolderBrowser
      open={open}
      busy={add.isPending}
      chosen={chosen}
      error={error}
      group={chosenGroup}
      groups={choices}
      onGroupChange={(next) => setValue('group', next)}
      listing={listing.data ?? null}
      onCancel={close}
      onOpen={(path) => openFolder(path)}
      onToggle={(folder) => setValue('chosen', toggleFolder(chosen, folder))}
      onCheck={(folders) => setValue('chosen', [...chosen, ...folders])}
      onSubmit={() => add.mutate()}
    />
  );
}
