import { describe, expect, it } from 'vitest';

import { summarySchema } from './summary-json.schema.js';

describe('summarySchema', () => {
  it('accepts a valid summary payload', () => {
    const result = summarySchema.safeParse({
      category: 'Recap',
      title: 'Summary of our discussion',
      subtitle: 'Key takeaways',
      summary: 'We discussed the game release and its features.',
      keyFindings: [{ text: 'Release date is April 29' }, { text: 'Open-world RPG' }],
      sources: [{ url: 'https://example.com', title: 'Example' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = summarySchema.safeParse({
      category: 'Recap',
      title: '',
      subtitle: '',
      summary: 'We discussed the game release.',
    });
    expect(result.success).toBe(false);
  });

  it('accepts missing optional arrays', () => {
    const result = summarySchema.safeParse({
      category: 'Recap',
      title: 'Summary',
      subtitle: '',
      summary: 'Short recap.',
    });
    expect(result.success).toBe(true);
  });
});
