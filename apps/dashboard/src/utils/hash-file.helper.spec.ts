import { describe, expect, it, vi } from 'vitest';

import { hashFile } from './hash-file.helper';

describe('hashFile', () => {
  it('returns a sha256 hex hash for a file (native webcrypto)', async () => {
    const file = {
      name: 'hello.png',
      type: 'image/png',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(5)),
    } as unknown as File;

    const digest = new Uint8Array([1, 2, 3, 255]);
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn().mockResolvedValue(digest),
      },
    });

    const result = await hashFile(file);

    expect(file.arrayBuffer).toHaveBeenCalled();
    expect(crypto.subtle.digest).toHaveBeenCalledWith(
      'SHA-256',
      expect.any(ArrayBuffer),
    );
    expect(result).toBe('010203ff');
  });

  it('falls back to pure-js sha256 without crypto.subtle (insecure origin)', async () => {
    vi.stubGlobal('crypto', {}); // no subtle — e.g. plain http origins

    const result = await hashFile(
      new File(['hello world'], 'hello.txt', { type: 'text/plain' }),
    );

    // Standard SHA-256("hello world") — identical to the server hashPayload.
    expect(result).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
  });
});
