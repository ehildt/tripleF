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

    expect(prompt).toContain('deterministic execution engine');
    expect(prompt).toContain('No markdown');
  });

  it('uses JSON for the text template', async () => {
    const prompt = buildContentSystemPrompt({
      template: 'text',
      tools: [],
      placeholders: ['text'],
      isImageTask: false,
    });

    expect(prompt).toContain('single key "text"');
    expect(prompt).toContain('valid JSON object');
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
    expect(prompt).toContain('USER-PROVIDED IMAGES');
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
      'EXECUTION INSTRUCTIONS: Write like a news article.',
    );
    expect(prompt).toContain('RETRIEVED MATERIAL');
    expect(prompt).toContain(
      'Retrieved articles and media are provided below. Use them to fill the response JSON.',
    );
  });
});
