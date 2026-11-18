// Calcul de la version et du versionCode : le workflow Release s'appuie dessus sans scénario qui le rejoue.
import { describe, expect, it } from 'vitest';
import { InvalidVersion, planVersion, VersionAlreadyReleased, versionCode, VersionOutOfRange } from './version.ts';

describe('planVersion', () => {
  it('CA-APPS-13 · takes the version of the commits for a stable release', () => {
    expect(planVersion({ bumped: 'v0.2.0', channel: 'stable', requested: '', tags: ['v0.1.0'] })).toBe('0.2.0');
  });

  it('CA-APPS-13 · numbers the betas of the next version one after the other', () => {
    expect(planVersion({ bumped: 'v0.2.0', channel: 'beta', requested: '', tags: ['v0.1.0'] })).toBe('0.2.0-beta.1');
    expect(
      planVersion({
        bumped: 'v0.2.0',
        channel: 'beta',
        requested: '',
        tags: ['v0.1.0', 'v0.2.0-beta.1', 'v0.2.0-beta.2'],
      }),
    ).toBe('0.2.0-beta.3');
  });

  it('releases the stable version after its betas', () => {
    expect(planVersion({ bumped: 'v0.2.0', channel: 'stable', requested: '', tags: ['v0.1.0', 'v0.2.0-beta.3'] })).toBe(
      '0.2.0',
    );
  });

  it('keeps a requested version, and makes it a beta on the beta channel', () => {
    expect(planVersion({ bumped: 'v0.2.0', channel: 'stable', requested: '1.0.0', tags: ['v0.1.0'] })).toBe('1.0.0');
    expect(planVersion({ bumped: 'v0.2.0', channel: 'beta', requested: 'v1.0.0', tags: [] })).toBe('1.0.0-beta.1');
    expect(planVersion({ bumped: 'v0.2.0', channel: 'beta', requested: '1.0.0-beta.4', tags: [] })).toBe(
      '1.0.0-beta.4',
    );
  });

  it('refuses a version that is not newer than a released one', () => {
    expect(() => planVersion({ bumped: 'v0.1.0', channel: 'stable', requested: '', tags: ['v0.1.0'] })).toThrow(
      VersionAlreadyReleased,
    );
    expect(() => planVersion({ bumped: 'v0.2.0', channel: 'beta', requested: '', tags: ['v0.2.0'] })).toThrow(
      VersionAlreadyReleased,
    );
  });

  it('refuses a beta number on the stable channel, and a text that is not a version', () => {
    expect(() => planVersion({ bumped: 'v0.2.0', channel: 'stable', requested: '0.3.0-beta.1', tags: [] })).toThrow(
      InvalidVersion,
    );
    expect(() => planVersion({ bumped: 'v0.2.0', channel: 'stable', requested: 'next', tags: [] })).toThrow(
      InvalidVersion,
    );
  });
});

describe('versionCode', () => {
  it('CA-APPS-13 · always grows, betas before their stable version', () => {
    const codes = ['0.1.0', '0.2.0-beta.1', '0.2.0-beta.2', '0.2.0', '0.2.1-beta.1', '0.2.1', '1.0.0'].map(versionCode);
    expect(codes).toEqual([10_099, 20_001, 20_002, 20_099, 20_101, 20_199, 1_000_099]);
  });

  it('refuses a version that would overflow its digits', () => {
    expect(() => versionCode('0.100.0')).toThrow(VersionOutOfRange);
    expect(() => versionCode('0.1.0-beta.99')).toThrow(VersionOutOfRange);
  });
});
