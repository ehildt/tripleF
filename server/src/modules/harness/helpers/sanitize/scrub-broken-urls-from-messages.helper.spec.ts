import { describe, expect, it } from 'vitest';

import { scrubBrokenUrlsFromMessages } from './scrub-broken-urls-from-messages.helper.js';

describe('scrubBrokenUrlsFromMessages', () => {
  it('returns messages unchanged when there are no broken urls', () => {
    const messages = [{ role: 'assistant', content: 'hello' }];
    expect(scrubBrokenUrlsFromMessages(messages as never, new Set())).toBe(
      messages,
    );
  });

  it('blanks broken urls in string content', () => {
    const messages = [
      { role: 'assistant', content: 'see https://broken.com/a.jpg here' },
    ];
    const result = scrubBrokenUrlsFromMessages(
      messages as never,
      new Set(['https://broken.com/a.jpg']),
    );
    expect(result[0].content).toBe('see   here');
  });

  it('leaves non-string content untouched', () => {
    const messages = [{ role: 'assistant', content: { text: 'x' } }];
    const result = scrubBrokenUrlsFromMessages(
      messages as never,
      new Set(['https://broken.com/a.jpg']),
    );
    expect(result[0].content).toEqual({ text: 'x' });
  });
});
