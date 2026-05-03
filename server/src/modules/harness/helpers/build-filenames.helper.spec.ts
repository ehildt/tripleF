import { describe, expect, it } from 'vitest';

import { buildFilenames } from './build-filenames.helper.js';

describe('buildFilenames', () => {
  it('lists names and hashes without variants', () => {
    const result = buildFilenames(
      [
        { name: 'a.png', hash: 'hash-a', variant: 'original' },
        { name: 'b.png', hash: 'hash-b', variant: 'original' },
      ],
      undefined,
    );

    expect(result).toBe('1. a.png (hash: hash-a)\n2. b.png (hash: hash-b)');
  });

  it('groups variants by original hash', () => {
    const result = buildFilenames(
      [
        {
          name: 'a_original.png',
          hash: 'hash-a_original',
          variant: 'original',
        },
        { name: 'a_gray.png', hash: 'hash-a_gray', variant: 'gray' },
      ],
      ['baseline', 'grayscale'],
    );

    expect(result).toBe(
      [
        '1. a.png (hash: hash-a)',
        '  original: baseline',
        '  gray: grayscale',
      ].join('\n'),
    );
  });

  it('separates multiple grouped images with blank lines', () => {
    const result = buildFilenames(
      [
        {
          name: 'a_original.png',
          hash: 'hash-a_original',
          variant: 'original',
        },
        {
          name: 'b_original.png',
          hash: 'hash-b_original',
          variant: 'original',
        },
      ],
      ['baseline', 'baseline'],
    );

    expect(result).toBe(
      [
        '1. a.png (hash: hash-a)',
        '  original: baseline',
        '',
        '2. b.png (hash: hash-b)',
        '  original: baseline',
      ].join('\n'),
    );
  });
});
