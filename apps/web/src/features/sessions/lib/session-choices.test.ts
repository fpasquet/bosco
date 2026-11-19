// Ce que les scénarios ne voient pas : la valeur et l'origine d'un réglage avant la réponse de Bosco, et un choix qui
// ne touche qu'au réglage changé.
import { describe, expect, it } from 'vitest';
import type { SessionDefaultsResolvedDto } from '@bosco/domain';
import { choicesAfter, effectiveSettings, NO_CHOICES, settingsDefaults, shownSettings } from './session-choices';

const CLUB: SessionDefaultsResolvedDto = {
  effort: { value: 'high', origin: { level: 'project', name: 'api-tarifs' } },
  model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } },
  permissionMode: { value: 'auto', origin: { level: 'group', name: 'Club des Trois Lacs' } },
  profile: { value: '/home/camille/.claude', origin: { level: 'group', name: 'Club des Trois Lacs' } },
};

describe('session choices', () => {
  it('asks for every permission until the defaults are read, then takes them with their origin', () => {
    expect(effectiveSettings(NO_CHOICES, undefined)).toEqual({ effort: null, model: null, permissionMode: 'ask' });
    expect(settingsDefaults(NO_CHOICES, CLUB)).toEqual({
      effort: { origin: 'défaut du projet api-tarifs', value: 'high' },
      model: { origin: 'défaut du projet api-tarifs', value: 'claude-sonnet-5-5' },
      permissionMode: 'défaut du groupe',
    });
  });

  it('says nothing of a default value read in the Claude Code profile', () => {
    const claude: SessionDefaultsResolvedDto = {
      ...CLUB,
      model: { value: 'opus', origin: { level: 'claudeProfile' } },
    };
    expect(settingsDefaults(NO_CHOICES, claude).model).toEqual({ origin: null, value: 'opus' });
  });

  it('shows the chosen model and effort only, the others checking their default', () => {
    const chosen = { ...NO_CHOICES, model: 'claude-haiku-4-5' };
    expect(shownSettings(chosen, effectiveSettings(chosen, CLUB))).toEqual({
      effort: null,
      model: 'claude-haiku-4-5',
      permissionMode: 'auto',
    });
  });

  it('makes a choice of the changed setting only', () => {
    const current = shownSettings(NO_CHOICES, effectiveSettings(NO_CHOICES, CLUB));
    const chosen = choicesAfter(NO_CHOICES, current, { ...current, permissionMode: 'plan' });
    expect(chosen).toEqual({ effort: null, model: null, permissionMode: 'plan' });
    expect(settingsDefaults(chosen, CLUB).permissionMode).toBe('choisi pour cette session');
    const back = choicesAfter(
      { ...chosen, model: 'claude-haiku-4-5' },
      { ...current, model: 'claude-haiku-4-5' },
      current,
    );
    expect(back.model).toBeNull();
  });
});
