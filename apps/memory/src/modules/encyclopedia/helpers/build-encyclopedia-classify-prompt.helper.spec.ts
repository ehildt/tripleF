import { buildEncyclopediaClassifyPrompt } from '@triplef/agent/prompts';
import { describe, expect, it } from 'vitest';

describe('buildEncyclopediaClassifyPrompt', () => {
  it('renders the category and topic schema keys', () => {
    const prompt = buildEncyclopediaClassifyPrompt();

    expect(prompt).toContain('category');
    expect(prompt).toContain('topic');
  });

  it('appends the known-category vocabulary when provided', () => {
    const prompt = buildEncyclopediaClassifyPrompt({
      categories: ['games', 'work'],
    });

    expect(prompt).toContain('games, work');
  });

  it('omits the vocabulary section when no categories are known', () => {
    const prompt = buildEncyclopediaClassifyPrompt();

    expect(prompt).not.toContain('KNOWN CATEGORIES');
  });
});
