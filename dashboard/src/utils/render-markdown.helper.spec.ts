import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './render-markdown.helper';

describe('renderMarkdown', () => {
  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('renders markdown elements to HTML', () => {
    const html = renderMarkdown('# Title\n\n**bold** and `code`');

    expect(html).toContain('<h3>Title</h3>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<code>code</code>');
  });

  it('shifts heading levels down by two (h1 → h3, h2 → h4)', () => {
    const html = renderMarkdown('# One\n\n## Two\n\n### Three');

    expect(html).toContain('<h3>One</h3>');
    expect(html).toContain('<h4>Two</h4>');
    expect(html).toContain('<h5>Three</h5>');
    expect(html).not.toMatch(/<h[12]/);
  });

  it('clamps shifted heading levels at h6', () => {
    const html = renderMarkdown('#### Four\n\n##### Five\n\n###### Six');

    expect(html).toContain('<h6>Four</h6>');
    expect(html).toContain('<h6>Five</h6>');
    expect(html).toContain('<h6>Six</h6>');
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
