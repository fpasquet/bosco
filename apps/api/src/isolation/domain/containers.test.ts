// Ce que les scénarios ne voient pas : la lecture des noms et des mesures de Docker.
import { describe, expect, it } from 'vitest';
import { bytesOf, coresOf, nearCeiling, sandboxKeyOf } from './containers.ts';

describe('containers', () => {
  it('recognizes the agent of a sandbox, not its proxy', () => {
    expect(sandboxKeyOf('bosco-s-7ad7871f65c1-agent')).toBe('7ad7871f65c1');
    expect(sandboxKeyOf('bosco-s-7ad7871f65c1-egress')).toBeNull();
    expect(sandboxKeyOf('bosco-t12')).toBeNull();
  });

  it('reads the usage that docker stats prints', () => {
    expect(coresOf('170.25%')).toBeCloseTo(1.7025);
    expect(bytesOf('3.6GiB')).toBeCloseTo(3.6 * 1024 ** 3);
    expect(bytesOf('412MiB')).toBeCloseTo(412 * 1024 ** 2);
    expect(bytesOf('n/a')).toBe(0);
  });

  it('CA-CONT-73 · turns orange from 80 % of a ceiling, never without one', () => {
    expect(nearCeiling(3.3, 4)).toBe(true);
    expect(nearCeiling(3.1, 4)).toBe(false);
    expect(nearCeiling(9, null)).toBe(false);
  });
});
