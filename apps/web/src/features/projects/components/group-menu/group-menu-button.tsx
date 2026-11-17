'use client';
import type { GroupDto } from '@bosco/domain';
import { useProjectActions } from '../project-actions';
import { GroupMenu } from './group-menu';

/** Menu ⋯ d'un groupe relié à Bosco : masquer de la barre latérale, supprimer après confirmation. */
export function GroupMenuButton({ group, variant = 'sidebar' }: { group: GroupDto; variant?: 'header' | 'sidebar' }) {
  const actions = useProjectActions();
  return (
    <GroupMenu
      group={group}
      variant={variant}
      onSidebar={(shown) => actions.showGroup(group, shown)}
      onDelete={() => actions.deleteGroup(group)}
    />
  );
}
