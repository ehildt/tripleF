import { buildConvictionSynthesisPrompt } from '@triplef/agent/prompts';
import { describe, expect, it } from 'vitest';

describe('buildConvictionSynthesisPrompt', () => {
  it('labels each evidence item by its ordinal position', () => {
    const prompt = buildConvictionSynthesisPrompt([
      { id: 'a', text: 'I am learning Rust' },
      {
        id: 'b',
        text: 'I am rewriting the payments service',
        category: 'work',
      },
    ]);

    expect(prompt).toContain('[0] I am learning Rust');
    expect(prompt).toContain(
      '[1] I am rewriting the payments service (category: work)',
    );
  });

  it('omits the category suffix when absent', () => {
    const prompt = buildConvictionSynthesisPrompt([
      { id: 'a', text: 'plain fact' },
    ]);

    expect(prompt).toContain('[0] plain fact');
    expect(prompt).not.toContain('(category:');
  });
});
