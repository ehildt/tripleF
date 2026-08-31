import { describe, expect, it, vi } from 'vitest';

import { downloadEntryBuffer } from './download-entry-buffer.helper.js';

describe('downloadEntryBuffer', () => {
  it('downloads an object and pairs it with its entry', async () => {
    const client = {
      getObject: vi.fn().mockResolvedValue(
        (async function* () {
          yield Buffer.from('ab');
          yield Buffer.from('cd');
        })(),
      ),
    } as never;
    const entry = { hash: 'h', name: 'img.png' } as never;
    const result = await downloadEntryBuffer(entry, {
      objectName: 'obj',
      client,
      bucket: 'b',
      logger: { warn: vi.fn() },
    });
    expect(result).toEqual({ buffer: Buffer.from('abcd'), entry });
  });

  it('returns null for a missing object', async () => {
    const client = {
      getObject: vi.fn().mockRejectedValue({ code: 'NoSuchKey' }),
    } as never;
    const warn = vi.fn();
    const result = await downloadEntryBuffer({ hash: 'h' } as never, {
      objectName: 'obj',
      client,
      bucket: 'b',
      logger: { warn },
    });
    expect(result).toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});
