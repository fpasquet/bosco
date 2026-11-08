import { describe, expect, it } from 'vitest';
import { pairingDigits, pairingLink } from './pairing';

describe('pairing', () => {
  it('links the QR code to the pairing page with the code, or to the address alone', () => {
    expect(pairingLink('https://192.168.1.20:4871', '482913')).toBe('https://192.168.1.20:4871/pair?code=482913');
    expect(pairingLink('https://192.168.1.20:4871/', null)).toBe('https://192.168.1.20:4871');
  });

  it('reads the six digits of a code, spaces allowed', () => {
    expect(pairingDigits('482 913')).toBe('482913');
    expect(pairingDigits('48291')).toBeNull();
    expect(pairingDigits('abcdef')).toBeNull();
  });
});
