import { describe, expect, it } from 'vitest';

import { mapPromptPreview } from './map-prompt-preview.helper.js';

describe('mapPromptPreview', () => {
  it('projects a prompt into the log-preview shape', () => {
    expect(
      mapPromptPreview({ role: 'user', content: 'a'.repeat(300) }),
    ).toEqual({ role: 'user', content: 'a'.repeat(200) });
  });
});
