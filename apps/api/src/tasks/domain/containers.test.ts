import { describe, expect, it } from 'vitest';
import { bytesOf, containerNameOf, coresOf, nearCeiling } from './containers.ts';

describe('containerNameOf', () => {
  it('recognizes the agent, the proxy and a test service of a task', () => {
    expect(containerNameOf('bosco-t18')).toEqual({ kind: 'agent', service: null, taskId: 18 });
    expect(containerNameOf('bosco-t18-egress')).toEqual({ kind: 'proxy', service: null, taskId: 18 });
    expect(containerNameOf('bosco-t17-svc-fake-gcs-server')).toEqual({
      kind: 'service',
      service: 'fake-gcs-server',
      taskId: 17,
    });
  });

  it('ignores a container Bosco did not launch (CA-CONT-72)', () => {
    expect(containerNameOf('postgres')).toBeNull();
    expect(containerNameOf('bosco-tx')).toBeNull();
  });
});

describe('docker stats values', () => {
  it('reads the processor in cores and the memory in bytes', () => {
    expect(coresOf('170.25%')).toBeCloseTo(1.7025);
    expect(coresOf('--')).toBe(0);
    expect(bytesOf('3.6GiB')).toBeCloseTo(3.6 * 1024 ** 3);
    expect(bytesOf('412MiB')).toBe(412 * 1024 ** 2);
    expect(bytesOf('1.2GB')).toBe(1.2e9);
    expect(bytesOf('0B')).toBe(0);
  });
});

describe('nearCeiling (CA-CONT-73)', () => {
  it('turns orange from 80 % of the ceiling, never without a ceiling', () => {
    expect(nearCeiling(3.6, 4)).toBe(true);
    expect(nearCeiling(1.1, 4)).toBe(false);
    expect(nearCeiling(1.7, 2)).toBe(true);
    expect(nearCeiling(10, null)).toBe(false);
  });
});
