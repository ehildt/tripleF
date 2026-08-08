import { describe, expect, it } from 'vitest';

import { engineObject } from './engine-object.helper';

describe('engineObject', () => {
  it('returns undefined for a missing snapshot', () => {
    expect(engineObject(undefined, 'serper')).toBeUndefined();
    expect(engineObject(null, 'serper')).toBeUndefined();
  });

  it('returns undefined when the engine is absent or not an object', () => {
    expect(engineObject({}, 'serper')).toBeUndefined();
    expect(engineObject({ serper: 'nope' }, 'serper')).toBeUndefined();
  });

  it('returns the engine object when present', () => {
    const engine = { enabled: true, apiKey: 'masked' };
    expect(engineObject({ serper: engine }, 'serper')).toEqual(engine);
  });
});
