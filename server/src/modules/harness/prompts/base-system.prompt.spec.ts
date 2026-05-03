import { describe, expect, it } from 'vitest';

import {
  buildBaseSystemPrompt,
  buildModeSystemPrompt,
} from './base-system.prompt.js';

describe('buildBaseSystemPrompt', () => {
  it('includes the core contract', () => {
    const prompt = buildBaseSystemPrompt({ hasImages: false });

    expect(prompt).toContain('deterministic multimodal execution engine');
    expect(prompt).toContain(
      'Structured templates require a single valid JSON object',
    );
    expect(prompt).toContain(
      'Free-form templates (text, compact) require plain text',
    );
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

describe('buildModeSystemPrompt', () => {
  it('returns only compact instructions for compact mode', () => {
    const prompt = buildModeSystemPrompt({ mode: 'compact', hasImages: false });

    expect(prompt).toContain('MODE: COMPACT');
    expect(prompt).not.toContain('MODE: TEXT');
    expect(prompt).not.toContain('PRECEDENCE (ABSOLUTE)');
  });

  it('uses the requested mode when images are present', () => {
    const prompt = buildModeSystemPrompt({ mode: 'describe', hasImages: true });

    expect(prompt).toContain('MODE: DESCRIBE');
    expect(prompt).toContain('MULTIMODAL RULES');
  });

  it('falls back to text mode when images are absent', () => {
    const prompt = buildModeSystemPrompt({
      mode: 'describe',
      hasImages: false,
    });

    expect(prompt).toContain('MODE: TEXT');
    expect(prompt).not.toContain('MODE: DESCRIBE');
  });
});
