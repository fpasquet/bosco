'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { displayPath } from '@/lib/format';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import {
  changeProfileDefaults,
  declareToken,
  profileSettingsQuery,
  sourcesQuery,
  tokenFilesQuery,
} from '../../api/sources';
import { ProfileSettingsView } from '../profile-settings-view';
import { TokenFileDialog } from '../token-file-dialog';

/** Réglages › Sources › un profil, relié à Bosco : un enregistrement vaut pour les sessions suivantes. */
export function ProfileSettingsScreen({ id }: { id: string }) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const { data: settings, isError } = useQuery(profileSettingsQuery(id));
  const { data: sources } = useQuery(sourcesQuery);
  const save = useMutation({
    mutationFn: (defaults: Parameters<typeof changeProfileDefaults>[1]) => changeProfileDefaults(id, defaults),
    onSuccess: async (saved) => {
      client.setQueryData(profileSettingsQuery(id).queryKey, saved);
      await client.invalidateQueries({ queryKey: ['pilot', 'defaults'] });
      push('Réglages du profil enregistrés : ils valent pour les sessions suivantes.', 'success');
    },
    onError: () => push('Les réglages du profil n’ont pas pu être enregistrés.', 'warning'),
  });
  // Choix du fichier du jeton longue durée : le dossier ouvert dans le navigateur ; null : fenêtre fermée
  const [browsing, setBrowsing] = useState<null | string>(null);
  const [opened, setOpened] = useState(false);
  const { data: listing } = useQuery({ ...tokenFilesQuery(browsing), enabled: opened });
  const token = useMutation({
    mutationFn: (path: null | string) => declareToken(id, path),
    onSuccess: async (saved, path) => {
      client.setQueryData(profileSettingsQuery(id).queryKey, saved);
      setOpened(false);
      // Le profil devient (ou cesse d'être) un abonnement : la nouvelle session et les réglages le proposent
      await Promise.all([
        client.invalidateQueries({ queryKey: ['pilot'] }),
        client.invalidateQueries({ queryKey: ['isolation'] }),
        client.invalidateQueries({ queryKey: sourcesQuery.queryKey }),
      ]);
      push(
        path
          ? 'Jeton longue durée enregistré : Bosco le lira à chaque tour, sans le garder.'
          : 'Jeton longue durée retiré : le profil revient à sa connexion.',
        'success',
      );
    },
    // Un fichier refusé s'affiche dans la fenêtre ; un retrait manqué, en notice
    onError: (_error, path) => {
      if (!path) push('Le jeton longue durée n’a pas pu être retiré.', 'warning');
    },
  });
  if (isError) return <p className="p-4 text-muted md:px-8 md:pt-6">Ce profil n’est pas surveillé par Bosco.</p>;
  if (!settings || !sources) return <PageSkeleton variant="detail" rows={5} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="sources" page={settings.source.label} />
      <ProfileSettingsView
        busy={save.isPending || token.isPending}
        path={displayPath(settings.source.path, sources.home)}
        settings={settings}
        tokenPath={settings.access.tokenFile ? displayPath(settings.access.tokenFile, sources.home) : null}
        onSave={(defaults) => save.mutate(defaults)}
        onUseToken={() => {
          token.reset();
          setBrowsing(null);
          setOpened(true);
        }}
        onRemoveToken={() => token.mutate(null)}
      />
      <TokenFileDialog
        open={opened}
        busy={token.isPending}
        listing={listing ?? null}
        serverError={token.error ? token.error.message : null}
        onCancel={() => setOpened(false)}
        onOpen={(path) => setBrowsing(path)}
        onSubmit={(path) => token.mutate(path)}
      />
    </div>
  );
}
