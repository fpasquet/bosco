'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ProjectDetailDto } from '@bosco/domain';
import { displayPath } from '@/lib/format';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useNotices } from '@/shared/hooks/use-notices';
import { useNow } from '@/shared/hooks/use-now';
import { groupsQuery } from '../../api/groups';
import { changeProject, projectQuery, ProjectRefused, projectsOverviewQuery } from '../../api/projects';
import { useProjectActions } from '../project-actions';
import { ProjectSettingsView } from './project-settings-view';

/** Onglet Réglages d'un projet, relié à Bosco : un changement vaut tout de suite. */
export function ProjectSettings({ id }: { id: number }) {
  const client = useQueryClient();
  const push = useNotices((state) => state.push);
  const actions = useProjectActions();
  const now = useNow(60_000);
  const { data: project } = useQuery(projectQuery(id));
  const { data: overview } = useQuery(projectsOverviewQuery);
  const { data: groups } = useQuery(groupsQuery);
  const [branchError, setBranchError] = useState<null | string>(null);
  const change = useMutation({
    mutationFn: (changes: Parameters<typeof changeProject>[1]) => changeProject(id, changes),
    onSuccess: async (saved: ProjectDetailDto) => {
      setBranchError(null);
      client.setQueryData(projectQuery(id).queryKey, saved);
      await client.invalidateQueries({ queryKey: ['projects', 'overview'] });
      await client.invalidateQueries({ queryKey: ['pilot', 'options'] });
    },
    onError: (failure, changes) => {
      const message = failure instanceof ProjectRefused ? failure.message : 'Le réglage n’a pas pu être enregistré.';
      if (changes.startBranch !== undefined) setBranchError(message);
      else push(message, 'warning');
    },
  });
  if (!project || !overview || !groups) return <SectionSkeleton rows={5} />;
  const named = { id: project.id, name: project.name };
  return (
    <ProjectSettingsView
      busy={change.isPending}
      groups={groups}
      now={now}
      project={{ ...project, path: displayPath(project.path, overview.home) }}
      startBranchError={branchError}
      onAddToGroup={(group) => actions.addToGroup(named, group)}
      onNewGroup={() => actions.newGroup([project.id])}
      onPlace={(place) => change.mutate({ place })}
      onRemove={() => actions.remove(named)}
      onStartBranch={(startBranch) => {
        setBranchError(null);
        change.mutate({ startBranch });
      }}
    />
  );
}
