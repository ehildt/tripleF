import { describe, expect, it } from 'vitest';

import { buildContentSystemPrompt } from './content-system.prompt.js';

describe('buildContentSystemPrompt', () => {
  it('declares the output contract', () => {
    const prompt = buildContentSystemPrompt({
      template: 'product',
      tools: [],
      requiredKeys: ['title', 'summary'],
      optionalKeys: [],
      isImageTask: false,
    });

    expect(prompt).toContain('deterministic multimodal execution engine');
    expect(prompt).toContain('single valid JSON object');
    expect(prompt).not.toContain('Markdown is allowed');
    expect(prompt).toContain('JSON RULES');
    expect(prompt).toContain('ITEM SHAPES');
  });

  it('allows Markdown for the text template', () => {
    const prompt = buildContentSystemPrompt({
      template: 'text',
      tools: [],
      requiredKeys: ['text'],
      optionalKeys: [],
      isImageTask: false,
    });

    expect(prompt).toContain('Return free-form text. Markdown is allowed and encouraged when it improves readability.');
    expect(prompt).toContain('MARKDOWN FORMAT (strict CommonMark)');
    expect(prompt).toContain('Never put spaces inside the markers');
    expect(prompt).toContain('Bold only the single most important term in a paragraph');
    expect(prompt).toContain('Prefer ## or ### headings to introduce sections');
    expect(prompt).not.toContain('JSON RULES');
  });

  it('requires a JSON object for structured templates', () => {
    const prompt = buildContentSystemPrompt({
      template: 'describe',
      tools: [],
      requiredKeys: ['title'],
      optionalKeys: ['galleryItems'],
      isImageTask: true,
    });

    expect(prompt).toContain('valid JSON object');
    expect(prompt).toContain('required top-level keys: title');
    expect(prompt).toContain('galleryItems');
    expect(prompt).toContain('MULTIMODAL RULES');
  });

  it('injects variant instructions when provided', () => {
    const prompt = buildContentSystemPrompt({
      template: 'article',
      instructions: 'Write like a news article.',
      tools: ['webSearch'],
      requiredKeys: [],
      optionalKeys: [],
      isImageTask: false,
    });

    expect(prompt).toContain('EXECUTION INSTRUCTIONS\nWrite like a news article.');
    expect(prompt).toContain('Retrieved articles and media are authoritative');
    expect(prompt).toContain('SOURCE TRUTH');
  });
});
