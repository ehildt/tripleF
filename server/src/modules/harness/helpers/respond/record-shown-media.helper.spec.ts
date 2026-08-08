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

const stepLogger = {
  log: vi.fn(),
  warn: vi.fn(),
};

describe('recordShownMedia', () => {
  it('returns early when there is no data', async () => {
    await recordShownMedia(
      ctx,
      undefined,
      [],
      shownMedia as never,
      stepLogger as never,
    );
    expect(shownMedia.recordShownMedia).not.toHaveBeenCalled();
  });

  it('records shown media and logs on success', async () => {
    shownMedia.recordShownMedia.mockResolvedValue(2);
    await recordShownMedia(
      ctx,
      { title: 'x' },
      [],
      shownMedia as never,
      stepLogger as never,
    );
    expect(shownMedia.recordShownMedia).toHaveBeenCalled();
    expect(stepLogger.log).toHaveBeenCalled();
  });

  it('warns when recording fails', async () => {
    shownMedia.recordShownMedia.mockRejectedValue(new Error('boom'));
    await recordShownMedia(
      ctx,
      { title: 'x' },
      [],
      shownMedia as never,
      stepLogger as never,
    );
    expect(stepLogger.warn).toHaveBeenCalled();
  });
});
