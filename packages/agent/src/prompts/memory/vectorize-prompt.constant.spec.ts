import { describe, expect, it } from 'vitest';

import { buildExtractionCorrectionPrompt } from './vectorize-prompt.constant.js';

describe('buildExtractionCorrectionPrompt', () => {
  it('renders the schema-derived shape instead of a hand-written template', () => {
    const prompt = buildExtractionCorrectionPrompt('boom');

    // The shape comes from the zod schema (single source of truth).
    expect(prompt).toContain('"facts"');
    expect(prompt).toContain('"kind"');
    expect(prompt).toContain('"stability"');
    expect(prompt).toContain('"tags"');
  });

  it('contains no placeholder ellipses a weak model could echo verbatim', () => {
    const prompt = buildExtractionCorrectionPrompt('boom');

    // A bare `..` token is exactly what JSON5 rejects (`invalid character '.'`).
    expect(prompt).not.toContain('...');
    expect(prompt).not.toContain('[...]');
  });
});
