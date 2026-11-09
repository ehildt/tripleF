import { describe, expect, it } from 'vitest';

import { parseChatIconVisibility } from './parse-chat-icon-visibility.helper';

describe('parseChatIconVisibility', () => {
  it('applies valid saved booleans over the defaults', () => {
    expect(parseChatIconVisibility('{"copy":false,"branch":false}')).toEqual({
      copy: false,
      include: true,
      branch: false,
      delete: true,
    });
  });

  it('ignores malformed fields and corrupt JSON', () => {
    expect(parseChatIconVisibility('{"copy":"no"}')).toEqual({
      copy: true,
      include: true,
      branch: true,
      delete: true,
    });
    expect(parseChatIconVisibility('{')).toEqual({
      copy: true,
      include: true,
      branch: true,
      delete: true,
    });
  });
});
