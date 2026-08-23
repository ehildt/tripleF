import { describe, expect, it } from 'vitest';

import { parseSourceList } from './parse-source-list.helper';

describe('parseSourceList', () => {
  it('parses one hostname per line', () => {
    expect(parseSourceList('wikipedia.org\narstechnica.com')).toEqual([
      'wikipedia.org',
      'arstechnica.com',
    ]);
  });

  it('strips schemes, www prefixes, and paths from pasted URLs', () => {
    expect(
      parseSourceList(
        'https://www.theguardian.com/international\nhttp://Blog.Example.org/post?id=3',
      ),
    ).toEqual(['theguardian.com', 'blog.example.org']);
  });

  it('lowercases and trims entries', () => {
    expect(parseSourceList('  Wikipedia.ORG \n\nARSTECHNICA.com')).toEqual([
      'wikipedia.org',
      'arstechnica.com',
    ]);
  });

  it('dedupes entries', () => {
    expect(
      parseSourceList('example.com\nwww.example.com\nhttps://example.com/a'),
    ).toEqual(['example.com']);
  });

  it('drops empty lines and non-hostname garbage', () => {
    expect(parseSourceList('\nnot a host\nnodot\nexample.com\n-..--')).toEqual([
      'example.com',
    ]);
  });

  it('returns an empty list for empty input', () => {
    expect(parseSourceList('')).toEqual([]);
    expect(parseSourceList('\n \n')).toEqual([]);
  });

  it('keeps subdomains', () => {
    expect(parseSourceList('en.wikipedia.org')).toEqual(['en.wikipedia.org']);
  });

  it('keeps valid slash-wrapped regex entries verbatim', () => {
    expect(
      parseSourceList('gstatic.com\n/^lh\\d+\\.googleusercontent\\.com$/'),
    ).toEqual(['gstatic.com', '/^lh\\d+\\.googleusercontent\\.com$/']);
  });

  it('drops regex entries that do not compile', () => {
    expect(parseSourceList('/(unclosed\nexample.com')).toEqual(['example.com']);
  });

  it('strips a trailing slash instead of misreading it as a regex entry', () => {
    expect(parseSourceList('example.com/')).toEqual(['example.com']);
  });

  it('keeps wildcard glob entries lowercased', () => {
    expect(parseSourceList('*.GStatic.com\n*.googleusercontent.com')).toEqual([
      '*.gstatic.com',
      '*.googleusercontent.com',
    ]);
  });

  it('rejects malformed glob entries', () => {
    expect(parseSourceList('*.\n*.nodot')).toEqual([]);
  });

  it('dedupes glob and plain forms separately', () => {
    expect(parseSourceList('*.example.com\nexample.com')).toEqual([
      '*.example.com',
      'example.com',
    ]);
  });
});
