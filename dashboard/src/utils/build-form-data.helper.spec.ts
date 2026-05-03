import { describe, expect, it } from 'vitest';

import { buildFormData } from './build-form-data.helper';

describe('buildFormData', () => {
  it('appends files and extras', () => {
    const file = new File(['x'], 'image.png', { type: 'image/png' });
    const form = buildFormData([file], { prompt: 'read this' });

    expect(form.get('prompt')).toBe('read this');
    expect(form.get('images')).toBeInstanceOf(File);
  });

  it('appends only files when no extras', () => {
    const file = new File(['x'], 'image.png', { type: 'image/png' });
    const form = buildFormData([file]);

    expect(form.get('prompt')).toBeNull();
    expect(form.get('images')).toBeInstanceOf(File);
  });
});
