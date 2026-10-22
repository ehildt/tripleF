import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { assistantResponseToText } from './assistant-response-to-text.helper';

describe('assistantResponseToText', () => {
  it('routes a known template to its own transform', () => {
    const data: AssistantResponseData = { title: 'The title' };
    const text = assistantResponseToText('article', data);
    expect(text).toContain('Title: The title');
  });

  it('falls back to the generic flattener for an unknown template', () => {
    const data: AssistantResponseData = { title: 'The title' };
    const text = assistantResponseToText('mystery', data);
    // The generic flattener writes a plain "Title: …" line without a section.
    expect(text).toContain('The title');
  });

  it('falls back when no template is supplied', () => {
    const data: AssistantResponseData = { title: 'The title' };
    expect(assistantResponseToText(undefined, data)).toContain('The title');
  });
});
