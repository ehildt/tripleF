import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { summaryToText } from './summary-to-text.helper';

describe('summaryToText', () => {
  it('renders the summary, key points, and sources', () => {
    const data: AssistantResponseData = {
      summary: 'The recap',
      keyFindings: [{ text: 'point' }],
      sources: [{ title: 'Src', url: 'https://a' }],
    };
    const text = summaryToText(data);
    expect(text).toContain('The recap');
    expect(text).toContain('Key points:');
    expect(text).toContain('- point');
    expect(text).toContain('Sources:');
  });
});
