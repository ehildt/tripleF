import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { newsToText } from './news-to-text.helper';

describe('newsToText', () => {
  it('renders headline fields, findings, sources, and related stories', () => {
    const data: AssistantResponseData = {
      headline: 'Big news',
      keyFindings: [{ text: 'finding' }],
      sources: [{ title: 'Src', url: 'https://a' }],
      relatedStories: [{ title: 'Related', url: 'https://b' }],
    };
    const text = newsToText(data);
    expect(text).toContain('Headline: Big news');
    expect(text).toContain('Key findings:');
    expect(text).toContain('Sources:');
    expect(text).toContain('Related stories:');
  });
});
