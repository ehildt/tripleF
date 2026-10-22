import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { mergeToText } from './merge-to-text.helper';

describe('mergeToText', () => {
  it('uses the evaluation transform for legacy evaluation merges', () => {
    const data: AssistantResponseData = { subject: 'Widget', verdict: 'Good' };
    expect(mergeToText(data)).toContain('Subject: Widget');
  });

  it('falls back to the generic flattener for non-evaluation merges', () => {
    const data: AssistantResponseData = { title: 'Merge' };
    expect(mergeToText(data)).toContain('Merge');
  });

  it('serializes merged evaluation groups before the shared fields', () => {
    const data: AssistantResponseData = {
      lead: 'Lead',
      mergedEvaluations: [{ title: 'A vs B', reasoning: 'reason' }],
    };
    const text = mergeToText(data);
    expect(text).toContain('Merged evaluation — A vs B');
    expect(text).toContain('Reasoning: reason');
  });
});
