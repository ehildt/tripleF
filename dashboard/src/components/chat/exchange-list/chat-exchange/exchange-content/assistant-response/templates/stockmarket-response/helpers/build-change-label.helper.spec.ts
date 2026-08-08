import { describe, expect, it } from 'vitest';

import { buildChangeLabel } from './build-change-label.helper';

describe('buildChangeLabel', () => {
  it('returns empty when neither value is provided', () => {
    expect(buildChangeLabel()).toBe('');
    expect(buildChangeLabel(undefined, undefined)).toBe('');
  });

  it('formats a positive absolute change with a leading plus', () => {
    expect(buildChangeLabel(1.5)).toBe('+1.5');
  });

  it('formats a negative absolute change without a plus', () => {
    expect(buildChangeLabel(-2.25)).toBe('-2.25');
  });

  it('formats a percent change with a trailing percent sign', () => {
    expect(buildChangeLabel(undefined, 2.3)).toBe('+2.3%');
    expect(buildChangeLabel(undefined, -1.1)).toBe('-1.1%');
  });

  it('joins absolute and percent changes with a space', () => {
    expect(buildChangeLabel(1.5, 2.3)).toBe('+1.5 +2.3%');
    expect(buildChangeLabel(-1.5, -2.3)).toBe('-1.5 -2.3%');
  });
});
