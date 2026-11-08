import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { describeToText } from './describe-to-text.helper';

describe('describeToText', () => {
  it('renders the key observations and sources', () => {
    const data: AssistantResponseData = {
      title: 'Describe',
      sectionContent: 'The description',
      keyFindings: [{ text: 'observation' }],
    };
    const text = describeToText(data);
    expect(text).toContain('Title: Describe');
    expect(text).toContain('The description');
    expect(text).toContain('Key observations:');
    expect(text).toContain('- observation');
  });
});
