import { describe, expect, it } from 'vitest';

import { collectHistoryVideoUrls } from './collect-history-video-urls.helper.js';

const assistant = (content: string) => ({ role: 'assistant', content });

describe('collectHistoryVideoUrls', () => {
  it('collects video urls after the marker', () => {
    const messages = [
      assistant(
        'Response\nPreviously shown videos\n(https://www.youtube.com/watch?v=abc123def45)',
      ),
    ];
    const keys = collectHistoryVideoUrls(messages as never);
    expect(keys).toContain('youtube:abc123def45');
  });

  it('ignores urls before the marker', () => {
    const messages = [
      assistant('(https://www.youtube.com/watch?v=abc123def45)'),
    ];
    expect(collectHistoryVideoUrls(messages as never).size).toBe(0);
  });

  it('ignores non-assistant messages', () => {
    const messages = [
      {
        role: 'user',
        content:
          'Previously shown videos\n(https://www.youtube.com/watch?v=abc123def45)',
      },
    ];
    expect(collectHistoryVideoUrls(messages as never).size).toBe(0);
  });
});
