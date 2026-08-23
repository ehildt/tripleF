import { describe, expect, it } from 'vitest';

import { buildFormDataSummary } from './build-form-data-summary.helper';

describe('buildFormDataSummary', () => {
  it('summarizes text fields excluding prompt', () => {
    const fd = new FormData();
    fd.append('model', 'llama3');
    fd.append('prompt', 'describe this');
    expect(buildFormDataSummary(fd)).toBe(
      'model: llama3\nprompt: describe this',
    );
  });

  it('summarizes files with sizes', () => {
    const fd = new FormData();
    const file = new File(['x'], 'test.png', { type: 'image/png' });
    fd.append('images', file);
    const result = buildFormDataSummary(fd);
    expect(result).toMatch(/1 file: test\.png \(\d+ B\)/);
  });
});
