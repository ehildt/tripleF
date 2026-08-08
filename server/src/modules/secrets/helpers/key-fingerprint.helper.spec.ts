import { describe, expect, it } from 'vitest';

import { keyFingerprint } from './key-fingerprint.helper.js';

describe('keyFingerprint', () => {
  it('returns the first 8 hex chars of the key digest', () => {
    const fp = keyFingerprint(Buffer.from('my-secret-key'));
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is stable for the same key', () => {
    const key = Buffer.from('my-secret-key');
    expect(keyFingerprint(key)).toBe(keyFingerprint(key));
  });

  it('differs for different keys', () => {
    expect(keyFingerprint(Buffer.from('key-a'))).not.toBe(
      keyFingerprint(Buffer.from('key-b')),
    );
  });
});
