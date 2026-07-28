import { describe, expect, it } from 'vitest';

import { buildContentSystemPrompt } from './content-system.prompt.js';

describe('buildContentSystemPrompt', () => {
  it('declares the output contract', () => {
    const prompt = buildContentSystemPrompt({
      template: 'article',
      tools: [],
      placeholders: ['title', 'summary'],
      isImageTask: false,
    });

    expect(prompt).toContain('deterministic multimodal execution engine');
    expect(prompt).toContain('Markdown is allowed');
    expect(prompt).toContain('JSON RULES');
    expect(prompt).toContain('ITEM SHAPES');
  });

  it('allows Markdown for the text template', () => {
    const prompt = buildContentSystemPrompt({
      template: 'text',
      tools: [],
      placeholders: ['text'],
      isImageTask: false,
    });

    expect(prompt).toContain(
      'Return free-form text. Markdown is allowed and encouraged when it improves readability.',
    );
    expect(prompt).not.toContain('JSON RULES');
  });

  it('uses plain text for the compact template', () => {
    const prompt = buildContentSystemPrompt({
      template: 'compact',
      tools: [],
      placeholders: [],
      isImageTask: false,
    });

    expect(prompt).toContain('Return plain text.');
    expect(prompt).not.toContain('JSON RULES');
    expect(prompt).toContain('MODE: COMPACT');
  });

  it('requires a JSON object for structured templates', () => {
    const prompt = buildContentSystemPrompt({
      template: 'describe',
      tools: [],
      placeholders: ['title', 'galleryItems'],
      isImageTask: true,
    });

    expect(prompt).toContain('valid JSON object');
    expect(prompt).toContain('title, galleryItems');
    expect(prompt).toContain('MULTIMODAL RULES');
  });

  it('injects variant instructions when provided', () => {
    const prompt = buildContentSystemPrompt({
      template: 'article',
      instructions: 'Write like a news article.',
      tools: ['webSearch'],
      placeholders: [],
      isImageTask: false,
    });

    expect(prompt).toContain(
      'EXECUTION INSTRUCTIONS\nWrite like a news article.',
    );
    expect(prompt).toContain('Retrieved articles and media are authoritative');
    expect(prompt).toContain('SOURCE TRUTH');
  });
});
