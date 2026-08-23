import { describe, expect, it } from 'vitest';

import { resolveTokenColor } from './resolve-token-color.helper';

describe('resolveTokenColor', () => {
  it('resolves a known token name to an rgba string', () => {
    const color = resolveTokenColor('accent-primary', 1);
    expect(color).toMatch(/^rgba?\(/);
  });

  it('falls back to the accent color for unknown or missing names', () => {
    const fallback = resolveTokenColor(undefined, 1);
    const unknown = resolveTokenColor('not-a-token', 1);
    expect(fallback).toMatch(/^rgba?\(/);
    expect(unknown).toMatch(/^rgba?\(/);
  });
});
