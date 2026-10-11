import { describe, expect, it } from 'vitest';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import { hasAnyMergeContent } from './has-any-merge-content.helper';

describe('hasAnyMergeContent', () => {
  it('returns false for an empty response', () => {
    expect(hasAnyMergeContent({} as HarnessResponseData)).toBe(false);
  });

  it('returns true when a title is present', () => {
    expect(hasAnyMergeContent({ title: 'T' } as HarnessResponseData)).toBe(
      true,
    );
  });

  it('returns true when a content list is present', () => {
    expect(
      hasAnyMergeContent({
        strengths: [{ text: 'Fast' }],
      } as HarnessResponseData),
    ).toBe(true);
  });

  it('returns false when only empty lists are present', () => {
    expect(hasAnyMergeContent({ strengths: [] } as HarnessResponseData)).toBe(
      false,
    );
  });
});
