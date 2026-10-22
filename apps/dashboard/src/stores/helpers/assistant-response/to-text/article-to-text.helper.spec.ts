import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { articleToText } from './article-to-text.helper';

describe('articleToText', () => {
  it('renders labels, key findings, cards, and sources', () => {
    const data: AssistantResponseData = {
      category: 'Tech',
      title: 'A title',
      summary: 'The summary',
      keyFindings: [{ text: 'finding' }],
      cards: [{ title: 'Card', url: 'https://a' }],
      sources: [{ title: 'Src', url: 'https://b' }],
    };
    const text = articleToText(data);
    expect(text).toContain('Category: Tech');
    expect(text).toContain('Title: A title');
    expect(text).toContain('The summary');
    expect(text).toContain('Key findings:');
    expect(text).toContain('- finding');
    expect(text).toContain('Article cards:');
    expect(text).toContain('Sources:');
  });

  it('returns an empty string when there is no content', () => {
    expect(articleToText({})).toBe('');
  });
});
