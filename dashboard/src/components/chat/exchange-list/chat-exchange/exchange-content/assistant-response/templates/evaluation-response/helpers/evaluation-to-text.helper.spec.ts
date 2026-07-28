import { describe, expect, it } from 'vitest';

import { evaluationToText } from './evaluation-to-text.helper';

describe('evaluationToText', () => {
  it('converts evaluation data to readable text', () => {
    const result = evaluationToText({
      category: 'Review',
      title: 'NTE evaluation',
      subject: 'Neverness to Everness',
      verdict: 'Promising',
      score: 8,
      scoreLabel: '8/10',
      reasoning: 'Strong visuals and combat.',
      strengths: [{ text: 'Great art direction' }],
      weaknesses: [{ text: 'Unclear monetization' }],
      recommendations: [{ text: 'Wait for reviews' }],
      sources: [{ title: 'IGN', url: 'https://ign.com' }],
    });

    expect(result).toContain('Category: Review');
    expect(result).toContain('Subject: Neverness to Everness');
    expect(result).toContain('Verdict: Promising');
    expect(result).toContain('Score: 8 (8/10)');
    expect(result).toContain('Reasoning: Strong visuals and combat.');
    expect(result).toContain('Strengths:');
    expect(result).toContain('- Great art direction');
    expect(result).toContain('Weaknesses:');
    expect(result).toContain('- Unclear monetization');
    expect(result).toContain('Recommendations:');
    expect(result).toContain('- Wait for reviews');
    expect(result).toContain('Sources:');
  });

  it('renders the score without a label', () => {
    expect(evaluationToText({ score: 7 })).toContain('Score: 7');
  });

  it('returns empty string for empty data', () => {
    expect(evaluationToText({})).toBe('');
  });
});
