import { describe, expect, it } from 'vitest';

import type { AssistantResponseData } from '@/types/assistant-response-data.model';

import { evaluationToText } from './evaluation-to-text.helper';

describe('evaluationToText', () => {
  it('renders score, reasoning, strengths, and comparison', () => {
    const data: AssistantResponseData = {
      subject: 'Widget',
      verdict: 'Good',
      score: 8,
      reasoning: 'Because',
      strengths: [{ text: 'strong' }],
      comparison: {
        summary: 'Summary',
        winner: 'Widget',
        criteria: [
          { name: 'Speed', scores: [{ subject: 'Widget', score: 8 }] },
        ],
      },
    };
    const text = evaluationToText(data);
    expect(text).toContain('Subject: Widget');
    expect(text).toContain('Score: 8');
    expect(text).toContain('Reasoning: Because');
    expect(text).toContain('Strengths:');
    expect(text).toContain('- strong');
    expect(text).toContain('Comparison: Summary');
    expect(text).toContain('Comparison criteria:');
    expect(text).toContain('- Speed (Widget: 8)');
  });

  it('renders subject profiles with indented details', () => {
    const data: AssistantResponseData = {
      subjects: [
        {
          name: 'A',
          score: 7,
          strengths: [{ text: 'plus' }],
          weaknesses: [{ text: 'minus' }],
        },
      ],
    };
    const text = evaluationToText(data);
    expect(text).toContain('Subjects:');
    expect(text).toContain('- A — 7/10');
    expect(text).toContain('  + plus');
    expect(text).toContain('  − minus');
  });
});
