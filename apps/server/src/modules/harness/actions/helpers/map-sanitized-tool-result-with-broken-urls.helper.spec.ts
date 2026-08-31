import { describe, expect, it, vi } from 'vitest';

import { mapSanitizedToolResultWithBrokenUrls } from './map-sanitized-tool-result-with-broken-urls.helper.js';

vi.mock('../../helpers/sanitize/sanitize-tool-result.helper.js', () => ({
  sanitizeToolResult: vi.fn((_name: string, result: unknown) => result),
}));

describe('mapSanitizedToolResultWithBrokenUrls', () => {
  it('sanitizes one tool result with broken-url sets', () => {
    expect(
      mapSanitizedToolResultWithBrokenUrls(
        { toolName: 'webSearch', result: { a: 1 } },
        new Set(['https://broken.com']),
        new Set(['https://broken-page.com']),
      ),
    ).toEqual({ toolName: 'webSearch', result: { a: 1 } });
  });
});
