import { describe, expect, it, vi } from 'vitest';

import { mapSanitizedToolResult } from './map-sanitized-tool-result.helper.js';

vi.mock('../../helpers/sanitize/sanitize-tool-result.helper.js', () => ({
  sanitizeToolResult: vi.fn((_name: string, result: unknown) => result),
}));

describe('mapSanitizedToolResult', () => {
  it('sanitizes one tool result', () => {
    expect(
      mapSanitizedToolResult({ toolName: 'webSearch', result: { a: 1 } }),
    ).toEqual({ toolName: 'webSearch', result: { a: 1 } });
  });
});
