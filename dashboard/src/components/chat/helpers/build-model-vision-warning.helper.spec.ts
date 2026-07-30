import { describe, expect, it } from 'vitest';

import { buildModelVisionWarning } from './build-model-vision-warning.helper';

const png = () => new File(['x'], 'photo.png', { type: 'image/png' });

describe('buildModelVisionWarning', () => {
  it('returns null when no files are attached', () => {
    expect(buildModelVisionWarning('model-x', [], [])).toBeNull();
  });

  it('returns null for models with the vision capability', () => {
    expect(
      buildModelVisionWarning('model-x', ['vision', 'tools'], [png()]),
    ).toBeNull();
  });

  it('returns null when capabilities are unknown', () => {
    expect(buildModelVisionWarning('model-x', undefined, [png()])).toBeNull();
  });

  it('warns when a model without vision gets files attached', () => {
    expect(buildModelVisionWarning('model-x', ['tools'], [png()])).toBe(
      'Model "model-x" does not support images. They will be excluded from this request.',
    );
  });
});
