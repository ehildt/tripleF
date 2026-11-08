import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { compareToText } from './compare-to-text.helper';

describe('compareToText', () => {
  it('renders the note, key differences, and sources', () => {
    const data: AssistantResponseData = {
      title: 'Compare',
      note: 'A note',
      keyFindings: [{ text: 'diff' }],
      sources: [{ title: 'Src', url: 'https://a' }],
    };
    const text = compareToText(data);
    expect(text).toContain('Title: Compare');
    expect(text).toContain('Note: A note');
    expect(text).toContain('Key differences:');
    expect(text).toContain('- diff');
    expect(text).toContain('Sources:');
  });
});
