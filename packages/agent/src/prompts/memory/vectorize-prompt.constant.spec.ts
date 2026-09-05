import { describe, expect, it } from 'vitest';

import { buildExtractionCorrectionPrompt, buildExtractionPrompt } from './vectorize-prompt.constant.js';

describe('buildExtractionPrompt', () => {
  it('draws the routing boundary: the partition extracts objective facts only', () => {
    const prompt = buildExtractionPrompt();

    expect(prompt).toContain('ROUTING BOUNDARY');
    expect(prompt).toContain('MUST NOT extract subjective user data');
    expect(prompt).toContain('deferred to the cognition tier');
    expect(prompt).toContain('return an empty facts array');
  });

  it('never offers preference as an emittable kind', () => {
    const prompt = buildExtractionPrompt();

    // The schema enum keeps "preference" for legacy records, but the prompt
    // marks it reserved so no NEW subjective data leaks into the partition.
    expect(prompt).toContain('preference — RESERVED, never emit');
    expect(prompt).not.toContain('User prefers single-line if statements');
  });
});

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
