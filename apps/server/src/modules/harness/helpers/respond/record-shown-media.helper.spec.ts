import { describe, expect, it, vi } from 'vitest';

import { recordShownMedia } from './record-shown-media.helper.js';

const ctx = {
  sessionId: 'sess',
  requestId: 'req',
  filters: { conversationId: 'conv' },
  outputs: { ingestedForRewrite: [] },
} as never;

const shownMedia = {
  recordShownMedia: vi.fn(),
};

describe('recordShownMedia', () => {
  it('returns early when there is no data', async () => {
    const result = await recordShownMedia(
      ctx,
      undefined,
      [],
      shownMedia as never,
    );
    expect(shownMedia.recordShownMedia).not.toHaveBeenCalled();
    expect(result).toEqual({ recordedCount: 0 });
  });

  it('records shown media and returns the count on success', async () => {
    shownMedia.recordShownMedia.mockResolvedValue(2);
    const result = await recordShownMedia(
      ctx,
      { title: 'x' },
      [],
      shownMedia as never,
    );
    expect(shownMedia.recordShownMedia).toHaveBeenCalled();
    expect(result).toEqual({ recordedCount: 2 });
  });

  it('returns the error when recording fails', async () => {
    shownMedia.recordShownMedia.mockRejectedValue(new Error('boom'));
    const result = await recordShownMedia(
      ctx,
      { title: 'x' },
      [],
      shownMedia as never,
    );
    expect(result.recordedCount).toBe(0);
    expect(result.error).toBeInstanceOf(Error);
  });
});
