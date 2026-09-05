import { describe, expect, it } from 'vitest';

import { mapTaggedModelOrigin } from './map-tagged-model-origin.helper.ts';

describe('mapTaggedModelOrigin', () => {
  it('stamps a local origin when the host is not cloud', () => {
    expect(mapTaggedModelOrigin({ name: 'llama3', details: {} }, false)).toEqual({
      name: 'llama3',
      details: {},
      origin: 'local',
    });
  });

  it('stamps a cloud origin when the host is cloud', () => {
    expect(mapTaggedModelOrigin({ name: 'llama3' }, true)).toEqual({
      name: 'llama3',
      origin: 'cloud',
    });
  });
});
