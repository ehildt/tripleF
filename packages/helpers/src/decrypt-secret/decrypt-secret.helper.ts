import crypto from 'node:crypto';

/**
 * Inverse of encryptSecret: parse the versioned payload, pick the key whose
 * fingerprint the payload names, and verify+decrypt it. Throws on malformed
 * payloads, unknown key fingerprints, and GCM auth-tag mismatches (tampered
 * or wrong-key data) — callers decide how to handle the failure.
 */
export function decryptSecret(payload: string, keysByFingerprint: ReadonlyMap<string, Buffer>): string {
  const [version, fingerprint, iv, tag, ciphertext] = payload.split('.');
  if (version !== 'v1' || !fingerprint || !iv || !tag || !ciphertext) {
    throw new Error('Malformed secret payload');
  }
  const key = keysByFingerprint.get(fingerprint);
  if (!key) {
    throw new Error(`No key for fingerprint ${fingerprint}`);
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}
