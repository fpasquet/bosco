'use client';
import { useQuery } from '@tanstack/react-query';
import { sourcesQuery } from '../../api/sources';
import { LiveTrackingHint } from '../live-tracking-hint';
import { ProfileChoice } from '../profile-choice';
import { Welcome } from '../welcome';

/** Vue d'ensemble : premier lancement tant qu'aucun profil n'est choisi (E1a). */
export function OverviewScreen({ title }: { title: string }) {
  const { data } = useQuery(sourcesQuery);
  if (!data) return null;
  if (data.sources.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-6 md:px-8">
        <Welcome />
        <ProfileChoice candidates={data.candidates} home={data.home} />
        <LiveTrackingHint />
      </div>
    );
  }
  return (
    <div className="px-8 pt-6">
      <h1 className="hidden font-display text-2xl font-semibold md:block">{title}</h1>
    </div>
  );
}
