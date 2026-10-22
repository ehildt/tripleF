import { describe, expect, it } from 'vitest';

import {
  YoutubeConfigAdapter,
  YoutubeConfigSchema,
} from './youtube-config.adapter.js';

describe('YoutubeConfigSchema', () => {
  const validConfig = YoutubeConfigAdapter({});

  it('accepts the adapter output', () => {
    expect(YoutubeConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('accepts an optional apiKey when present', () => {
    expect(
      YoutubeConfigSchema.safeParse({ ...validConfig, apiKey: 'key' }).success,
    ).toBe(true);
  });

  it('rejects a missing videos table', () => {
    const withoutVideos = { ...validConfig } as Partial<typeof validConfig>;
    delete withoutVideos.videos;
    const result = YoutubeConfigSchema.safeParse(withoutVideos);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes('videos'))).toBe(
      true,
    );
  });

  it.each([1, 10, 50])('accepts videos.results %s (bounds)', (results) => {
    expect(
      YoutubeConfigSchema.safeParse({
        ...validConfig,
        videos: { enabled: true, results },
      }).success,
    ).toBe(true);
  });

  it.each([0, 51, 1.5])(
    'rejects videos.results %s (out of bounds)',
    (results) => {
      const result = YoutubeConfigSchema.safeParse({
        ...validConfig,
        videos: { enabled: true, results },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes('results'))).toBe(
        true,
      );
    },
  );
});
