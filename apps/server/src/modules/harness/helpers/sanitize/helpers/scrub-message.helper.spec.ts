import { describe, expect, it } from 'vitest';

import { scrubMessage } from './scrub-message.helper.js';

describe('scrubMessage', () => {
  it('blanks broken urls out of string content', () => {
    expect(
      scrubMessage(
        { role: 'user', content: 'see https://broken.com/img.jpg here' },
        [{ escaped: 'https://broken\\.com/img\\.jpg' }],
      ),
    ).toEqual({ role: 'user', content: 'see   here' });
  });

  it('returns non-string content unchanged', () => {
    const message = { role: 'user', content: [{ type: 'text', text: 'x' }] };
    expect(scrubMessage(message as never, [])).toBe(message);
  });
});
