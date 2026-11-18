// Ce que les scénarios ne voient pas : la lecture des noms et des mesures de Docker.
import { describe, expect, it } from 'vitest';
import { bytesOf, coresOf, dockerDateOf, nearCeiling, sandboxKeyOf, serviceStateOf } from './containers.ts';

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

describe('docker ps of the data services', () => {
  it('reads the creation date with its offset', () => {
    expect(dockerDateOf('2026-11-18 15:43:54 +0100 CET')?.toISOString()).toBe('2026-11-18T14:43:54.000Z');
    expect(dockerDateOf('yesterday')).toBeNull();
  });

  it('reads the state of a service from its status and health', () => {
    expect(serviceStateOf('Up 3 minutes (healthy)')).toBe('ready');
    expect(serviceStateOf('Up 2 seconds (health: starting)')).toBe('starting');
    expect(serviceStateOf('Up 1 minute (unhealthy)')).toBe('failed');
    expect(serviceStateOf('Exited (1) 5 seconds ago')).toBe('failed');
  });
});
