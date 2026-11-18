'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { displayPath } from '@/lib/format';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { SettingsHeader } from '@/shared/layouts/settings-tabs';
import { changeProfileDefaults, profileSettingsQuery, sourcesQuery } from '../../api/sources';
import { ProfileSettingsView } from '../profile-settings-view';

/** Réglages › Sources › un profil (E4g), relié à Bosco : un enregistrement vaut pour les sessions suivantes. */
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
  if (isError) return <p className="p-4 text-muted md:px-8 md:pt-6">Ce profil n’est pas surveillé par Bosco.</p>;
  if (!settings || !sources) return <PageSkeleton variant="detail" rows={5} />;
  return (
    <div className="flex flex-col gap-4 p-4 md:px-8 md:pt-6">
      <SettingsHeader current="sources" page={settings.source.label} />
      <ProfileSettingsView
        busy={save.isPending}
        path={displayPath(settings.source.path, sources.home)}
        settings={settings}
        onSave={(defaults) => save.mutate(defaults)}
      />
    </div>
  );
}
