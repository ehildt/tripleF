import { describe, expect, it } from 'vitest';

import { buildBaseSystemPrompt } from './base-system.prompt.js';

describe('buildBaseSystemPrompt', () => {
  it('includes the core contract', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: false });

    expect(prompt).toContain('deterministic multimodal execution engine');
    expect(prompt).toContain(
      'Structured templates require a single valid JSON object',
    );
    expect(prompt).toContain('Markdown is allowed');
    expect(prompt).toContain('PRECEDENCE (ABSOLUTE)');
  });

  it('adds multimodal and search policies when images are present', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: true });

    expect(prompt).toContain('MULTIMODAL RULES');
    expect(prompt).toContain('SEARCH:');
  });

  it('omits multimodal and search policies when no images are present', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: false });

    expect(prompt).not.toContain('MULTIMODAL RULES');
    expect(prompt).not.toContain('SEARCH:');
  });
});
