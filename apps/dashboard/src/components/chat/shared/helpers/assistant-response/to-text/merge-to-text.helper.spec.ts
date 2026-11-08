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

  it('renders note, introduction, subjects and comparison of a group', () => {
    const data: AssistantResponseData = {
      mergedEvaluations: [
        {
          title: 'A vs B',
          relationNote: 'unrelated topics',
          introduction: 'Both are open-world games.',
          subjects: [
            {
              name: 'A',
              description: 'First game',
              score: 8.5,
              strengths: [{ text: 'Combat' }, { text: '   ' }],
              weaknesses: [{ text: 'Grind' }],
            },
            { name: 'B', scoreLabel: 'solid' },
            { name: '   ' },
          ],
          comparison: {
            summary: 'A wins on combat.',
            winner: 'A',
            verdict: 'Close call',
            criteria: [
              {
                name: 'Combat',
                scores: [
                  { subject: 'A', score: 9 },
                  { subject: 'B', score: 7 },
                  { subject: '  ', score: 5 },
                  { subject: 'C' },
                ],
              },
              { name: '   ' },
            ],
          },
          reasoning: 'Because combat matters most.',
          recommendations: [{ text: 'Play A first' }],
        },
      ],
    };

    const text = mergeToText(data);

    expect(text).toContain('Merged evaluation — A vs B');
    expect(text).toContain('Note: unrelated topics');
    expect(text).toContain('Introduction: Both are open-world games.');
    expect(text).toContain('Subjects:');
    expect(text).toContain('- A — 8.5/10');
    expect(text).toContain('  First game');
    expect(text).toContain('  + Combat');
    expect(text).toContain('  − Grind');
    expect(text).toContain('- B — solid');
    expect(text).toContain('Comparison: A wins on combat.');
    expect(text).toContain('Winner: A');
    expect(text).toContain('Comparison verdict: Close call');
    expect(text).toContain('Comparison criteria:');
    expect(text).toContain('- Combat (A: 9, B: 7)');
    expect(text).toContain('Reasoning: Because combat matters most.');
    expect(text).toContain('Recommendations:');
    expect(text).toContain('Play A first');
    // The merged block must not leak the raw array into the shared flattener.
    expect(text).not.toContain('mergedEvaluations');
  });

  it('omits blank group sections instead of emitting empty labels', () => {
    const data: AssistantResponseData = {
      mergedEvaluations: [{ title: 'A vs B', subjects: [], comparison: {} }],
    };

    const text = mergeToText(data);

    expect(text).not.toContain('Subjects:');
    expect(text).not.toContain('Comparison:');
    expect(text).not.toContain('Winner:');
    expect(text).not.toContain('Comparison criteria:');
  });

  it('keeps the shared fields after the merged blocks', () => {
    const data: AssistantResponseData = {
      title: 'Shared title',
      mergedEvaluations: [{ title: 'A vs B' }],
    };

    const text = mergeToText(data);

    expect(text.indexOf('Merged evaluation')).toBeLessThan(
      text.indexOf('Shared title'),
    );
  });

  it('skips groups that render no text', () => {
    const data: AssistantResponseData = {
      title: 'Only title',
      mergedEvaluations: [{}],
    };

    expect(mergeToText(data)).toBe(mergeToText({ title: 'Only title' }));
  });
});
