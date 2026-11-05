import { describe, expect, it } from 'vitest';

import { validateSummaryOutput } from './summary.validator.js';

const validPayload = {
  category: 'news',
  title: 'Quarterly results',
  subtitle: 'Markets',
  summary: 'A short summary.',
};

describe('validateSummaryOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateSummaryOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('accepts an empty hero media url', () => {
    const result = validateSummaryOutput({
      ...validPayload,
      heroImageUrl: '',
      heroVideoUrl: '',
    });

    expect(result.valid).toBe(true);
  });

  it('rejects an empty title', () => {
    const result = validateSummaryOutput({ ...validPayload, title: '' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects a hero video without a title', () => {
    const result = validateSummaryOutput({
      ...validPayload,
      heroVideoUrl: 'https://www.youtube.com/watch?v=abc123',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects an untrusted hero media url', () => {
    expect(
      validateSummaryOutput({
        ...validPayload,
        heroImageUrl: 'javascript:alert(1)',
      }).valid,
    ).toBe(false);
  });
});
