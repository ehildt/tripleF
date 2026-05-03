import { describe, expect, it, vi } from 'vitest';

import { hashFile } from './hash-file.helper';

describe('hashFile', () => {
  it('returns a sha256 hex hash for a file', async () => {
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
});
