import { describe, expect, it } from 'vitest';

import { evaluationSchema } from './evaluation-json.schema.js';

describe('evaluationSchema', () => {
  it('accepts a valid evaluation payload', () => {
    const result = evaluationSchema.safeParse({
      category: 'Review',
      title: 'Game Evaluation',
      subtitle: 'A fair assessment',
      subject: 'Neverness to Everness',
      verdict: 'Promising open-world RPG',
      score: 8,
      scoreLabel: '8/10',
      reasoning: 'Strong visuals and combat, but monetization is unclear.',
      strengths: [{ text: 'Impressive visuals' }],
      weaknesses: [{ text: 'Unclear monetization' }],
      recommendations: [{ text: 'Wait for reviews after launch' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = evaluationSchema.safeParse({
      category: 'Review',
      title: 'Game Evaluation',
      subtitle: '',
      subject: '',
      verdict: '',
      score: 8,
      scoreLabel: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts minimal optional fields', () => {
    const result = evaluationSchema.safeParse({
      category: 'Review',
      title: 'Game Evaluation',
      subtitle: '',
      subject: 'Neverness to Everness',
      verdict: 'Promising',
      score: 7,
      scoreLabel: 'Good',
    });
    expect(result.success).toBe(true);
  });
});
