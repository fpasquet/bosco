// Ce que l'écran ne montre pas : le lien du QR code d'appairage, lu par l'application Android (CA-APPS-05).
import { describe, expect, it } from 'vitest';
import { parsePairing, shortFingerprint, spacedCode } from './pairing';

const FP = Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, '0').toUpperCase()).join(':');

describe('parsePairing', () => {
  it('reads the address, the code and the fingerprint of the certificate', () => {
    expect(parsePairing(`https://192.168.1.24:4310/pair?code=482913&fp=${encodeURIComponent(FP)}`)).toEqual({
      code: '482913',
      fingerprint: FP,
      url: 'https://192.168.1.24:4310',
    });
  });

  it('refuses a link that is not a Bosco pairing, and ignores a malformed fingerprint', () => {
    // eslint-disable-next-line sonarjs/no-clear-text-protocols -- un lien en clair est justement refusé
    expect(parsePairing('http://192.168.1.24:4310/pair?code=482913')).toBeNull();
    expect(parsePairing('https://exemple.fr/')).toBeNull();
    expect(parsePairing('https://192.168.1.24:4310/pair?code=482913&fp=zz')?.fingerprint).toBeNull();
  });
});

describe('display', () => {
  it('shortens the fingerprint and spaces the code', () => {
    expect([shortFingerprint(FP), spacedCode('482913')]).toEqual(['00:01:…:1F', '482 913']);
  });
});
