import { hashPayload } from '../hash-payload/hash-payload.helper.ts';

/**
 * Stable, non-sensitive identifier of a master key: the first 8 hex chars
 * of its SHA-256 digest. Embedded in every encrypted payload so the right
 * key can be picked from the key ring after a rotation (OWASP/ASVS crypto
 * agility) without leaking any key material.
 */
export function keyFingerprint(key: Buffer): string {
  return hashPayload(key).slice(0, 8);
}
