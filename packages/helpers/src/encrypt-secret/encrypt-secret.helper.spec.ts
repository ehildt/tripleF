import crypto from 'node:crypto';

import { decryptSecret } from '../decrypt-secret/decrypt-secret.helper.ts';
import { keyFingerprint } from '../key-fingerprint/key-fingerprint.helper.ts';

import { encryptSecret } from './encrypt-secret.helper.ts';

describe('encryptSecret', () => {
  it('produces a v1 payload with the key fingerprint', () => {
    const key = crypto.randomBytes(32);
    const payload = encryptSecret('hello', key);
    const [version, fingerprint] = payload.split('.');
    expect(version).toBe('v1');
    expect(fingerprint).toBe(keyFingerprint(key));
  });

  it('round-trips through decryptSecret', () => {
    const key = crypto.randomBytes(32);
    const payload = encryptSecret('secret text', key);
    const keys = new Map([[keyFingerprint(key), key]]);
    expect(decryptSecret(payload, keys)).toBe('secret text');
  });

  it('produces a unique iv per call', () => {
    const key = crypto.randomBytes(32);
    const a = encryptSecret('same', key);
    const b = encryptSecret('same', key);
    expect(a).not.toBe(b);
  });
});
