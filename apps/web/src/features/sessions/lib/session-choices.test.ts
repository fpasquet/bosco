// Ce que les scénarios ne voient pas : la valeur par défaut d'un réglage avant la réponse de Bosco, et l'origine qu'une
// valeur du profil Claude Code ne dit pas.
import { describe, expect, it } from 'vitest';
import type { SessionDefaultsResolvedDto } from '@bosco/domain';
import { effectiveSettings, NO_CHOICES, settingsDefaults } from './session-choices';

const CLUB: SessionDefaultsResolvedDto = {
  effort: { value: 'high', origin: { level: 'project', name: 'api-tarifs' } },
  model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } },
  permissionMode: { value: 'auto', origin: { level: 'group', name: 'Club des Trois Lacs' } },
  profile: { value: '/home/camille/.claude', origin: { level: 'group', name: 'Club des Trois Lacs' } },
};

describe('session choices', () => {
  it('asks for every permission until the defaults are read, then takes them with their origin', () => {
    expect(effectiveSettings(NO_CHOICES, undefined)).toEqual({ effort: null, model: null, permissionMode: 'ask' });
    expect(settingsDefaults(undefined)).toEqual({ permissionMode: { origin: null, value: null } });
    expect(settingsDefaults(CLUB)).toEqual({
      effort: { origin: 'défaut du projet api-tarifs', value: 'high' },
      model: { origin: 'défaut du projet api-tarifs', value: 'claude-sonnet-5-5' },
      permissionMode: { origin: 'défaut du groupe', value: 'auto' },
    });
  });

  it('says nothing of a default value read in the Claude Code profile', () => {
    const claude: SessionDefaultsResolvedDto = {
      ...CLUB,
      model: { value: 'opus', origin: { level: 'claudeProfile' } },
      permissionMode: { value: 'ask', origin: { level: 'claudeProfile' } },
    };
    expect(settingsDefaults(claude).model).toEqual({ origin: null, value: 'opus' });
    expect(settingsDefaults(claude).permissionMode).toEqual({ origin: null, value: 'ask' });
  });

  it('takes the chosen settings first, the others from the defaults', () => {
    const chosen = { ...NO_CHOICES, permissionMode: 'plan' as const };
    expect(effectiveSettings(chosen, CLUB)).toEqual({
      effort: 'high',
      model: 'claude-sonnet-5-5',
      permissionMode: 'plan',
    });
  });
});
