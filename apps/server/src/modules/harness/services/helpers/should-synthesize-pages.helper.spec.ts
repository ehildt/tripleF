import { describe, expect, it } from 'vitest';

import { shouldSynthesizePages } from './should-synthesize-pages.helper.js';

describe('shouldSynthesizePages', () => {
  it('synthesizes all pages when none are referenced (bootstrap fallback)', () => {
    expect(
      shouldSynthesizePages(['p1', 'p2', 'p3'], new Set(['other-hash'])),
    ).toBe(true);
  });

  it('synthesizes nothing when the client references at least one page', () => {
    expect(shouldSynthesizePages(['p1', 'p2', 'p3'], new Set(['p2']))).toBe(
      false,
    );
  });

  it('treats a partial selection as authoritative', () => {
    expect(
      shouldSynthesizePages(['p1', 'p2', 'p3'], new Set(['p1', 'p3'])),
    ).toBe(false);
  });

  it('synthesizes nothing when every page is referenced', () => {
    expect(shouldSynthesizePages(['p1', 'p2'], new Set(['p1', 'p2']))).toBe(
      false,
    );
  });

  it('synthesizes all pages for an empty manifest', () => {
    expect(shouldSynthesizePages([], new Set())).toBe(true);
  });
});
