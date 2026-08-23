import { describe, expect, it } from 'vitest';

import { collectHistoryImageUrls } from './collect-history-image-urls.helper.js';

const assistant = (content: string) => ({ role: 'assistant', content });

describe('collectHistoryImageUrls', () => {
  it('collects storage urls after the marker', () => {
    const messages = [
      assistant(
        'Response\nPreviously shown images\n(/api/v1/storage/sess/conv/abc123)',
      ),
    ];
    const urls = collectHistoryImageUrls(messages as never);
    expect(urls).toContain('/api/v1/storage/sess/conv/abc123');
  });

  it('ignores urls before the marker', () => {
    const messages = [assistant('(/api/v1/storage/sess/conv/abc123)')];
    expect(collectHistoryImageUrls(messages as never).size).toBe(0);
  });

  it('ignores non-assistant messages', () => {
    const messages = [
      {
        role: 'user',
        content: 'Previously shown images\n(/api/v1/storage/sess/conv/abc123)',
      },
    ];
    expect(collectHistoryImageUrls(messages as never).size).toBe(0);
  });
});
