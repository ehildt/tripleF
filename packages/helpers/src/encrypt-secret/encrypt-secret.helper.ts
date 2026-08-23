import crypto from 'node:crypto';

import { keyFingerprint } from '../key-fingerprint/key-fingerprint.helper.ts';

const PAYLOAD_VERSION = 'v1';

/**
 * Encrypt a UTF-8 secret with AES-256-GCM (OWASP first-choice authenticated
 * mode) and encode it as a self-describing payload:
 *
 *   v1.<keyFingerprint>.<iv>.<authTag>.<ciphertext>   (base64url parts)
 *
 * A fresh random 96-bit IV is generated per call via CSPRNG — GCM nonce
 * reuse is catastrophic, and random 96-bit IVs are the NIST SP 800-38D
 * recommended construction. The key fingerprint lets decryption find the
 * right key after a rotation.
 */
export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PAYLOAD_VERSION,
    keyFingerprint(key),
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}
