import { describe, expect, it } from 'vitest';

import { normalizeTopic } from './normalize-topic.helper.js';

describe('normalizeTopic', () => {
  it('lowercases, trims, and folds whitespace runs', () => {
    expect(normalizeTopic('  Wuthering   Waves  ')).toBe('wuthering waves');
  });

  it('collapses case variants to one canonical form', () => {
    expect(normalizeTopic('Wuthering Waves')).toBe('wuthering waves');
    expect(normalizeTopic('wuthering waves')).toBe('wuthering waves');
  });

  it('never merges semantically different labels (dog vs animal)', () => {
    expect(normalizeTopic('dog')).toBe('dog');
    expect(normalizeTopic('animal')).toBe('animal');
  });

  it('returns undefined for empty or whitespace-only input', () => {
    expect(normalizeTopic('')).toBeUndefined();
    expect(normalizeTopic('   ')).toBeUndefined();
    expect(normalizeTopic(undefined)).toBeUndefined();
    expect(normalizeTopic(null)).toBeUndefined();
  });

  it('returns undefined for overlong labels', () => {
    expect(normalizeTopic('x'.repeat(81))).toBeUndefined();
  });
});
