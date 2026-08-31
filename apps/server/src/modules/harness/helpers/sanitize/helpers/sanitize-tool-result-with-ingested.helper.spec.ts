import { describe, expect, it, vi } from 'vitest';

import { sanitizeToolResultWithIngested } from './sanitize-tool-result-with-ingested.helper.js';

describe('sanitizeToolResultWithIngested', () => {
  const options = {
    ingestedByUrl: new Map(),
    brokenImageUrls: new Set<string>(),
    brokenPageUrls: new Set<string>(),
  };

  it('dispatches an image search result', () => {
    const sanitizeImage = vi.fn().mockReturnValue('sanitized-image');
    const sanitizeWeb = vi.fn();
    expect(
      sanitizeToolResultWithIngested(
        { toolName: 'serperImageSearch', result: {} },
        options,
        sanitizeImage,
        sanitizeWeb,
      ),
    ).toEqual({ toolName: 'serperImageSearch', result: 'sanitized-image' });
    expect(sanitizeWeb).not.toHaveBeenCalled();
  });

  it('returns non-search results unchanged', () => {
    const tr = { toolName: 'webFetch', result: {} };
    expect(sanitizeToolResultWithIngested(tr, options, vi.fn(), vi.fn())).toBe(
      tr,
    );
  });
});
