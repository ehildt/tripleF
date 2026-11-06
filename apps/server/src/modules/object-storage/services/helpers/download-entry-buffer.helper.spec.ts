import { GetObjectCommand } from '@aws-sdk/client-s3';

import { downloadEntryBuffer } from './download-entry-buffer.helper.js';

const entry = {
  name: 'image.png',
  type: 'image/png',
  hash: 'abc123',
  size: 4,
};

describe('downloadEntryBuffer', () => {
  it('downloads object bytes and pairs them with their meta entry', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({
        Body: {
          transformToByteArray: vi
            .fn()
            .mockResolvedValue(new TextEncoder().encode('data')),
        },
      }),
    };
    const logger = { warn: vi.fn() };

    const result = await downloadEntryBuffer(entry, {
      objectName: 'images/s/c/abc123.bin',
      client,
      bucket: 'test-bucket',
      logger,
    });

    expect(result?.buffer.toString()).toBe('data');
    expect(result?.entry).toBe(entry);
    expect(client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(['NoSuchKey', 'NotFound'])(
    'returns null and warns for %s',
    async (name) => {
      const client = {
        send: vi.fn().mockRejectedValue(Object.assign(new Error(), { name })),
      };
      const logger = { warn: vi.fn() };

      await expect(
        downloadEntryBuffer(entry, {
          objectName: 'images/s/c/abc123.bin',
          client,
          bucket: 'test-bucket',
          logger,
        }),
      ).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'Missing referenced image images/s/c/abc123.bin; skipping.',
      );
    },
  );

  it('returns null for an AWS response with HTTP 404 metadata', async () => {
    const client = {
      send: vi.fn().mockRejectedValue({
        name: 'S3ServiceException',
        $metadata: { httpStatusCode: 404 },
      }),
    };

    await expect(
      downloadEntryBuffer(entry, {
        objectName: 'images/s/c/abc123.bin',
        client,
        bucket: 'test-bucket',
        logger: { warn: vi.fn() },
      }),
    ).resolves.toBeNull();
  });

  it('rethrows non-missing-object errors', async () => {
    const error = new Error('network failure');
    const client = { send: vi.fn().mockRejectedValue(error) };
    const logger = { warn: vi.fn() };

    await expect(
      downloadEntryBuffer(entry, {
        objectName: 'images/s/c/abc123.bin',
        client,
        bucket: 'test-bucket',
        logger,
      }),
    ).rejects.toBe(error);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
