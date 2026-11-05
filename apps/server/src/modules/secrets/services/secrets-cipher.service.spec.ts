import crypto from 'node:crypto';

import { describe, expect, it } from 'vitest';

import type { SecretsConfigService } from '../configs/secrets-config.service.js';

import { SecretsCipherService } from './secrets-cipher.service.js';

const ACTIVE_KEY = crypto.randomBytes(32).toString('hex');
const PREVIOUS_KEY = crypto.randomBytes(32).toString('hex');

const buildCipher = (activeKey?: string, previousKey?: string) =>
  new SecretsCipherService({
    config: { activeKey, previousKey },
  } as unknown as SecretsConfigService);

describe('SecretsCipherService', () => {
  describe('without an active key', () => {
    const cipher = buildCipher(undefined);

    it('reports itself disabled', () => {
      expect(cipher.isEnabled()).toBe(false);
      expect(cipher.activeFingerprint()).toBeNull();
    });

    it('refuses to encrypt instead of falling back to plaintext', () => {
      expect(cipher.encrypt('sk-secret')).toBeUndefined();
    });

    it('never asks for re-encryption', () => {
      expect(cipher.needsReEncryption('v1.abc.def')).toBe(false);
    });
  });

  describe('with an active key', () => {
    const cipher = buildCipher(ACTIVE_KEY);

    it('reports itself enabled and exposes the active fingerprint', () => {
      expect(cipher.isEnabled()).toBe(true);
      expect(cipher.activeFingerprint()).toBeTruthy();
    });

    it('round-trips a secret', () => {
      const payload = cipher.encrypt('sk-secret')!;

      expect(payload.startsWith('v1.')).toBe(true);
      expect(cipher.decrypt(payload)).toBe('sk-secret');
    });

    it('does not store the plaintext in the payload', () => {
      expect(cipher.encrypt('sk-secret')!).not.toContain('sk-secret');
    });

    it('produces a unique payload per call', () => {
      expect(cipher.encrypt('same')).not.toBe(cipher.encrypt('same'));
    });

    it('returns undefined for an empty secret', () => {
      expect(cipher.encrypt('')).toBeUndefined();
    });

    it('does not ask for re-encryption of a payload written with the active key', () => {
      expect(cipher.needsReEncryption(cipher.encrypt('sk-secret')!)).toBe(
        false,
      );
    });
  });

  describe('decryption failures', () => {
    const cipher = buildCipher(ACTIVE_KEY);

    it('returns null for a malformed payload', () => {
      expect(cipher.decrypt('not-a-payload')).toBeNull();
    });

    it('returns null for a payload encrypted with an unknown key', () => {
      const foreign = buildCipher(crypto.randomBytes(32).toString('hex'));

      expect(cipher.decrypt(foreign.encrypt('sk-secret')!)).toBeNull();
    });

    it('returns null for tampered ciphertext', () => {
      const payload = cipher.encrypt('sk-secret')!;
      const parts = payload.split('.');
      const ciphertext = parts.at(-1)!;
      const replacement = ciphertext[0] === 'A' ? 'B' : 'A';
      parts[parts.length - 1] = `${replacement}${ciphertext.slice(1)}`;
      const tampered = parts.join('.');

      expect(tampered).not.toBe(payload);
      expect(cipher.decrypt(tampered)).toBeNull();
    });
  });

  describe('key rotation', () => {
    it('decrypts payloads written with the previous key', () => {
      const previous = buildCipher(PREVIOUS_KEY);
      const rotated = buildCipher(ACTIVE_KEY, PREVIOUS_KEY);
      const payload = previous.encrypt('sk-secret')!;

      expect(rotated.decrypt(payload)).toBe('sk-secret');
    });

    it('flags previous-key payloads for re-encryption', () => {
      const previous = buildCipher(PREVIOUS_KEY);
      const rotated = buildCipher(ACTIVE_KEY, PREVIOUS_KEY);

      expect(rotated.needsReEncryption(previous.encrypt('sk-secret')!)).toBe(
        true,
      );
    });

    it('treats a payload without a fingerprint as not needing rotation', () => {
      const rotated = buildCipher(ACTIVE_KEY);

      expect(rotated.needsReEncryption('v1')).toBe(false);
    });
  });
});
