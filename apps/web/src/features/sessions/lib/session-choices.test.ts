// Ce que les scénarios ne voient pas : la valeur et l'origine d'un réglage avant la réponse de Bosco, et un choix qui
// ne touche qu'au réglage changé.
import { describe, expect, it } from 'vitest';
import type { SessionDefaultsResolvedDto } from '@bosco/domain';
import { choicesAfter, effectiveSettings, NO_CHOICES, settingsOrigins } from './session-choices';

const CLUB: SessionDefaultsResolvedDto = {
  effort: { value: 'high', origin: { level: 'project', name: 'api-tarifs' } },
  model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'api-tarifs' } },
  permissionMode: { value: 'auto', origin: { level: 'group', name: 'Club des Trois Lacs' } },
  profile: { value: '/home/camille/.claude', origin: { level: 'group', name: 'Club des Trois Lacs' } },
};

describe('session choices', () => {
  it('asks for every permission until the defaults are read, then takes them with their origin', () => {
    expect(effectiveSettings(NO_CHOICES, undefined)).toEqual({ effort: null, model: null, permissionMode: 'ask' });
    expect(settingsOrigins(NO_CHOICES, CLUB)).toEqual({
      effort: 'défaut du projet api-tarifs',
      model: 'défaut du projet api-tarifs',
      permissionMode: 'défaut du groupe',
    });
  });

  it('makes a choice of the changed setting only', () => {
    const current = effectiveSettings(NO_CHOICES, CLUB);
    const chosen = choicesAfter(NO_CHOICES, current, { ...current, permissionMode: 'plan' });
    expect(chosen).toEqual({ effort: null, model: null, permissionMode: 'plan' });
    expect(settingsOrigins(chosen, CLUB).permissionMode).toBe('choisi pour cette session');
  });
});
