// Ce que les scénarios ne voient pas : un nom pris à la casse près, les lignes blanches des instructions, un projet
// coché deux fois, et « Tous les projets » qui ne se règle pas comme un autre groupe.
import { describe, expect, it } from 'vitest';
import { ALL_PROJECTS, cleanInstructions, Group, GroupError, GroupNameTaken, instructionLines } from './group.ts';

const clubs = () =>
  Group.create({ id: 2, name: 'Club des Trois Lacs', description: '  ', others: [], projects: [4, 7, 4, 9] });

describe('Group', () => {
  it('keeps each project once, the first checked as the principal, shown in the sidebar without instructions', () => {
    const group = clubs().toSnapshot();
    expect(group.projects).toEqual([4, 7, 9]);
    expect(group).toMatchObject({ description: null, instructions: '', sidebar: true, system: false });
    expect(clubs().principal()).toBe(4);
  });

  it('refuses a name already taken, whatever its case, and an empty name', () => {
    const others = [clubs().toSnapshot(), Group.allProjects(1).toSnapshot()];
    const create = (name: string) => () => Group.create({ id: 3, name, description: null, others, projects: [] });
    expect(create('club des trois lacs ')).toThrow(GroupNameTaken);
    expect(create('tous les projets')).toThrow(GroupNameTaken);
    expect(create('  ')).toThrow(GroupError);
  });

  it('makes the next project the principal when the principal leaves', () => {
    const group = clubs();
    group.removeProject(4);
    expect(group.principal()).toBe(7);
    expect(group.toSnapshot().projects).toEqual([7, 9]);
  });

  it('keeps « Tous les projets » to its instructions: no settings, no projects, never deleted', () => {
    const all = Group.allProjects(1, 'Node 22 au minimum.\n');
    expect(all.toSnapshot()).toMatchObject({ name: ALL_PROJECTS, sidebar: false, system: true, projects: [] });
    expect(() => all.change({ sidebar: true }, [])).toThrow(GroupError);
    expect(() => all.arrange([1])).toThrow(GroupError);
    expect(() => all.checkDeletable()).toThrow(GroupError);
    all.writeInstructions('Messages de commit en anglais.');
    expect(all.toSnapshot().instructions).toBe('Messages de commit en anglais.');
  });
});

describe('instructions', () => {
  it('drop the trailing spaces and the blank lines around the text, keeping the blank lines inside', () => {
    expect(cleanInstructions('\n  \nTests avec Vitest.  \n\nJournaux en JSON.\n\n')).toBe(
      'Tests avec Vitest.\n\nJournaux en JSON.',
    );
    expect(cleanInstructions(' \n ')).toBe('');
  });

  it('count one instruction per line that is not blank', () => {
    expect(instructionLines('Tests avec Vitest.\n\n  Journaux en JSON. ')).toEqual([
      'Tests avec Vitest.',
      'Journaux en JSON.',
    ]);
  });
});
