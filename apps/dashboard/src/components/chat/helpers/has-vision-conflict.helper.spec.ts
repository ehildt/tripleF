import { describe, expect, it } from 'vitest';

import { hasVisionConflict } from './has-vision-conflict.helper';

const png = () => new File(['x'], 'photo.png', { type: 'image/png' });

describe('hasVisionConflict', () => {
  it('returns false when no files are attached', () => {
    expect(hasVisionConflict([], [])).toBe(false);
  });

  it('returns false for models with the vision capability', () => {
    expect(hasVisionConflict(['vision', 'tools'], [png()])).toBe(false);
  });

  it('returns false when capabilities are unknown', () => {
    expect(hasVisionConflict(undefined, [png()])).toBe(false);
  });

  it('returns true when a model without vision gets files attached', () => {
    expect(hasVisionConflict(['tools'], [png()])).toBe(true);
  });
});
