import { describe, expect, it } from 'vitest';

import { buildBaseSystemPrompt } from './base-system.prompt.js';

describe('buildBaseSystemPrompt', () => {
  it('carries only step-agnostic rules', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: false });

    expect(prompt).toContain('SECURITY');
    expect(prompt).toContain('NOISE / BOILERPLATE FILTER');
    expect(prompt).not.toContain('Markdown is allowed');
    expect(prompt).not.toContain('PRECEDENCE (ABSOLUTE)');
    expect(prompt).not.toContain('OUTPUT CONTRACT');
  });

  it('adds the multimodal policy when images are present', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: true });

    expect(prompt).toContain('MULTIMODAL RULES');
  });

  it('omits the multimodal policy when no images are present', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: false });

    expect(prompt).not.toContain('MULTIMODAL RULES');
  });
});
