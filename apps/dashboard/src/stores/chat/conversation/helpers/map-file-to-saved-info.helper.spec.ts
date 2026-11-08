import { describe, expect, it } from 'vitest';

import { mapFileToSavedInfo } from './map-file-to-saved-info.helper';

describe('mapFileToSavedInfo', () => {
  it('projects a file into the saved-info shape', () => {
    expect(
      mapFileToSavedInfo({
        name: 'img.png',
        size: 10,
        type: 'image/png',
      } as File),
    ).toEqual({ name: 'img.png', size: 10, type: 'image/png' });
  });
});
