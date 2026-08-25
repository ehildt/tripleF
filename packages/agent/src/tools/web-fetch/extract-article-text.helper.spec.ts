import { extractArticleText } from './extract-article-text.helper.ts';

const articleBody = [
  'The quick brown fox jumps over the lazy dog while the sun sets over the quiet valley.',
  'Researchers have long studied the behavior of foxes in urban environments, noting their adaptability.',
  'A new study published this week adds a surprising finding: foxes remember individual humans.',
  'The team tracked forty foxes across three cities over two years, recording thousands of encounters.',
  'What emerged was a clear pattern of recognition and even preference for familiar faces.',
  'This challenges the long-held assumption that wild canids treat all humans as a single threat category.',
  'The implications reach beyond curiosity, touching on conservation and urban wildlife management.',
  'Experts caution that the sample size is modest and the findings need replication before policy changes.',
].join(' ');

const articleHtml = `<!doctype html>
<html>
  <head><title>Fox Study</title></head>
  <body>
    <nav><a href="/">Home</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
    <article>
      <h1>Foxes Remember Human Faces</h1>
      <p>${articleBody}</p>
    </article>
    <footer>Copyright 2025 Example News. All rights reserved.</footer>
  </body>
</html>`;

describe('extractArticleText', () => {
  it('extracts the article as Markdown and drops nav/footer boilerplate', () => {
    const result = extractArticleText(articleHtml);
    expect(result).toContain('Foxes Remember Human Faces');
    expect(result).toContain('foxes remember individual humans');
    expect(result).not.toContain('Copyright 2025');
    expect(result).not.toContain('/about');
  });

  it('falls back to a turndown of the full body for non-article pages', () => {
    const result = extractArticleText('<html><body><p>Hello world</p></body></html>');
    expect(result).toContain('Hello world');
  });

  it('returns empty content for empty input without throwing', () => {
    expect(extractArticleText('')).toBe('');
  });
});
