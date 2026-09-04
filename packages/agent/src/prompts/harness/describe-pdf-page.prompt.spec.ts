import { describe, expect, it } from 'vitest';

import { buildDescribePdfPagePrompt } from './describe-pdf-page.prompt.js';

describe('buildDescribePdfPagePrompt', () => {
  it('frames the page coordinates and verbatim transcription contract', () => {
    const prompt = buildDescribePdfPagePrompt('cv.pdf', 2, 5);

    expect(prompt).toContain('page 2 of 5');
    expect(prompt).toContain('"cv.pdf"');
    expect(prompt).toContain('verbatim');
    expect(prompt).toContain('Layout');
    expect(prompt).toContain('knowledge base');
  });

  it('defines the empty-page answer explicitly', () => {
    expect(buildDescribePdfPagePrompt('a.pdf', 1, 1)).toContain('This page contains no readable content.');
  });

  it('never emits template placeholders', () => {
    const prompt = buildDescribePdfPagePrompt('a.pdf', 1, 1);

    expect(prompt).not.toMatch(/\.\.\./);
    expect(prompt).not.toContain('[...]');
    expect(prompt).not.toContain('${');
  });
});
