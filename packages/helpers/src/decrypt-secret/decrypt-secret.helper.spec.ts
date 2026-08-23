import crypto from 'node:crypto';

import { decryptSecret } from './decrypt-secret.helper.ts';

function encryptSecret(key: Buffer, plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const fingerprint = crypto.createHash('sha256').update(key).digest('hex').slice(0, 8);
  return `v1.${fingerprint}.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

describe('decryptSecret', () => {
  it('decrypts a valid payload', () => {
    const key = crypto.randomBytes(32);
    const payload = encryptSecret(key, 'hello world');
    const keys = new Map([[crypto.createHash('sha256').update(key).digest('hex').slice(0, 8), key]]);
    expect(decryptSecret(payload, keys)).toBe('hello world');
  });

  it('throws on a malformed payload', () => {
    expect(() => decryptSecret('garbage', new Map())).toThrow('Malformed secret payload');
  });

  it('throws on an unknown key fingerprint', () => {
    const key = crypto.randomBytes(32);
    const payload = encryptSecret(key, 'hello');
    expect(() => decryptSecret(payload, new Map())).toThrow('No key for fingerprint');
  });
});
