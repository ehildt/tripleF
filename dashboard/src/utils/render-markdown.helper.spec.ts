import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './render-markdown.helper';

describe('renderMarkdown', () => {
  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders markdown elements to HTML', () => {
    const html = renderMarkdown('# Title\n\n**bold** and `code`');

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('escapes raw HTML in the source', () => {
    const html = renderMarkdown('<script>alert("xss")</script>');

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("xss")</');
  });

  it('linkifies bare URLs', () => {
    const html = renderMarkdown('Visit https://example.com for details');

    expect(html).toContain('<a href="https://example.com">');
  });

  it('converts single line breaks to <br> tags', () => {
    const html = renderMarkdown('first line\nsecond line');

    expect(html).toContain('<br>');
  });

  it('does not render executable links', () => {
    const html = renderMarkdown('[click](javascript:alert(1))');

    expect(html).not.toContain('href="javascript:');
  });
});
