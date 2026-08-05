import { describe, expect, it, vi } from 'vitest';

import { filterVerifiedMedia } from './filter-verified-media.helper.js';

function mockValidator(results: Record<string, unknown>) {
  return {
    validateUrls: vi.fn(async (urls: string[]) =>
      (urls as string[]).map((url) => ({
        url,
        kind: results[url] ?? 'image',
      })),
    ),
  } as any;
}

/** Find the validator call made with the given dimension-check mode. */
function callWithDimension(
  validator: { validateUrls: ReturnType<typeof vi.fn> },
  checkImageDimensions: boolean,
) {
  return validator.validateUrls.mock.calls.find(
    ([, options]: [string[], { checkImageDimensions?: boolean }]) =>
      options.checkImageDimensions === checkImageDimensions,
  );
}

describe('filterVerifiedMedia', () => {
  it('validates strict images with a 1280x720 dimension check', async () => {
    const validator = mockValidator({});
    await filterVerifiedMedia(
      validator,
      [{ imageUrl: 'https://a/img.jpg' }],
      [],
    );
    const [, options] = callWithDimension(validator, true)!;
    expect(options.checkImageDimensions).toBe(true);
    expect(options.minWidth).toBe(1280);
    expect(options.minHeight).toBe(720);
  });

  it('validates skip-dimension (Bright Data) images without the dimension check', async () => {
    const validator = mockValidator({});
    await filterVerifiedMedia(
      validator,
      [{ imageUrl: 'https://a/small.jpg', skipDimensionCheck: true }],
      [],
    );
    const [urls, options] = callWithDimension(validator, false)!;
    expect(urls).toEqual(['https://a/small.jpg']);
    expect(options.checkImageDimensions).toBe(false);
  });

  it('keeps a skip-dimension image even though it is below 720p', async () => {
    const validator = mockValidator({ 'https://a/small.jpg': 'image' });
    const { images } = await filterVerifiedMedia(
      validator,
      [
        {
          imageUrl: 'https://a/small.jpg',
          width: 1000,
          height: 630,
          skipDimensionCheck: true,
        },
      ],
      [],
    );
    expect(images).toHaveLength(1);
    expect(images[0].imageUrl).toBe('https://a/small.jpg');
  });

  it('drops a strict image whose probe is broken or below 720p', async () => {
    const validator = mockValidator({ 'https://a/big.jpg': 'broken' });
    const { images } = await filterVerifiedMedia(
      validator,
      [{ imageUrl: 'https://a/big.jpg' }],
      [],
    );
    expect(images).toHaveLength(0);
  });

  it('splits strict and skip-dimension images into separate validator calls', async () => {
    const validator = mockValidator({});
    await filterVerifiedMedia(
      validator,
      [
        { imageUrl: 'https://a/strict.jpg' },
        { imageUrl: 'https://a/skip.jpg', skipDimensionCheck: true },
      ],
      [],
    );
    expect(callWithDimension(validator, true)![0]).toEqual([
      'https://a/strict.jpg',
    ]);
    expect(callWithDimension(validator, false)![0]).toEqual([
      'https://a/skip.jpg',
    ]);
  });
});
