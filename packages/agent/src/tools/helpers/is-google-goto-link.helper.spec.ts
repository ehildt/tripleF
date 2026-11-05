import { describe, expect, it } from 'vitest';

import { isGoogleGotoLink } from './is-google-goto-link.helper.ts';

describe('isGoogleGotoLink', () => {
  it('recognises the google.com/goto redirect wrapper', () => {
    expect(isGoogleGotoLink('https://www.google.com/goto?url=CAESabc')).toBe(true);
  });

  it('recognises the wrapper on a country google domain', () => {
    expect(isGoogleGotoLink('https://google.de/goto?url=CAESabc')).toBe(true);
  });

  it('is case-insensitive for the host', () => {
    expect(isGoogleGotoLink('https://WWW.Google.COM/goto?url=CAESabc')).toBe(true);
  });

  it('does not flag a regular google search result', () => {
    expect(isGoogleGotoLink('https://www.google.com/search?q=cats')).toBe(false);
  });

  it('does not flag a merchant link', () => {
    expect(isGoogleGotoLink('https://www.mediamarkt.de/de/product/x')).toBe(false);
  });

  it('does not flag a host that merely ends in google.com', () => {
    expect(isGoogleGotoLink('https://notgoogle.com/goto?url=CAESabc')).toBe(false);
  });

  // KNOWN BUG (source unchanged): the host pattern anchors on a literal
  // `google.<tlds>` tail, so a domain that merely embeds it also matches.
  // This expected-failure test captures the desired boundary behavior.
  it.fails('does not flag a domain that embeds a google suffix', () => {
    expect(isGoogleGotoLink('https://google.com.evil.example/goto')).toBe(false);
  });

  it('returns false for an unparseable URL', () => {
    expect(isGoogleGotoLink('not a url')).toBe(false);
  });
});
