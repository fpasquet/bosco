'use client';
import { useQuery } from '@tanstack/react-query';
import { groupsQuery } from '../../api/groups';
import { proposalsQuery } from '../../api/projects';
import { useProjectActions } from '../project-actions';
import { ProjectMenu } from './project-menu';

/** Menu ⋯ d'un projet relié à Bosco : ses groupes, ses décisions à valider, et les actions partagées. */
export function ProjectMenuButton({
  project,
  variant = 'sidebar',
}: {
  project: { id: number; name: string; pinned: boolean };
  variant?: 'header' | 'sidebar';
}) {
  const actions = useProjectActions();
  const { data: groups } = useQuery(groupsQuery);
  const { data: proposals } = useQuery(proposalsQuery);
  const others = (groups ?? []).filter((group) => !group.system && !group.projects.some(({ id }) => id === project.id));
  return (
    <ProjectMenu
      project={project}
      variant={variant}
      proposals={(proposals ?? []).filter((decision) => decision.target.name === project.name).length}
      groups={others.map(({ id, name }) => ({ id, name }))}
      onAddToGroup={({ id }) => {
        const group = others.find((candidate) => candidate.id === id);
        if (group) actions.addToGroup(project, group);
      }}
      onNewGroup={() => actions.newGroup([project.id])}
      onPin={(pinned) => actions.pin(project, pinned)}
      onRemove={() => actions.remove(project)}
    />
  );
}
