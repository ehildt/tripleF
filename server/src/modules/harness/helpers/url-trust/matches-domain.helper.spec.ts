import { describe, expect, it } from 'vitest';

import { hostnameOf, matchesDomain } from './matches-domain.helper.js';

describe('matchesDomain', () => {
  it('matches an exact hostname', () => {
    expect(matchesDomain('https://example.org', 'example.org')).toBe(true);
  });

  it('matches a subdomain of a plain entry', () => {
    expect(matchesDomain('https://en.example.org', 'example.org')).toBe(true);
  });

  it('matches a wildcard glob entry', () => {
    expect(matchesDomain('https://en.example.org', '*.example.org')).toBe(true);
  });

  it('rejects an unrelated hostname', () => {
    expect(matchesDomain('https://other.org', 'example.org')).toBe(false);
  });

  it('matches a slashed regex entry', () => {
    expect(
      matchesDomain(
        'https://lh3.googleusercontent.com/x',
        '/^lh\\d+\\.googleusercontent\\.com$/',
      ),
    ).toBe(true);
  });

  it('ignores a leading www on both sides', () => {
    expect(matchesDomain('https://www.example.org', 'www.example.org')).toBe(
      true,
    );
  });
});

describe('hostnameOf', () => {
  it('extracts a lowercased hostname without www', () => {
    expect(hostnameOf('https://www.Example.org/path')).toBe('example.org');
  });

  it('returns empty for an invalid url', () => {
    expect(hostnameOf('not a url')).toBe('');
  });
});
