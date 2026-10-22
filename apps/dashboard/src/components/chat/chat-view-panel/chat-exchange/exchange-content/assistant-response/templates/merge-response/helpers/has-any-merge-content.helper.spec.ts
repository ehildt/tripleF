import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { hasAnyMergeContent } from './has-any-merge-content.helper';

describe('hasAnyMergeContent', () => {
  it('returns false for an empty response', () => {
    expect(hasAnyMergeContent({} as AssistantResponseData)).toBe(false);
  });

  it('returns true when a title is present', () => {
    expect(hasAnyMergeContent({ title: 'T' } as AssistantResponseData)).toBe(
      true,
    );
  });

  it('returns true when a content list is present', () => {
    expect(
      hasAnyMergeContent({
        strengths: [{ text: 'Fast' }],
      } as AssistantResponseData),
    ).toBe(true);
  });

  it('returns false when only empty lists are present', () => {
    expect(hasAnyMergeContent({ strengths: [] } as AssistantResponseData)).toBe(
      false,
    );
  });
});
