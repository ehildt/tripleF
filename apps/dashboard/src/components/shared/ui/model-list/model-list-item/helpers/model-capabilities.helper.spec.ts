import { describe, expect, it } from 'vitest';

import { modelCapabilities } from './model-capabilities.helper';

describe('modelCapabilities', () => {
  it('returns the supported selector capabilities in stable order', () => {
    expect(
      modelCapabilities({
        model: 'm',
        capabilities: ['completion', 'tools', 'audio', 'vision', 'thinking'],
      }),
    ).toEqual(['vision', 'audio', 'tools', 'thinking', 'completion']);
  });

  it('keeps only selector-relevant capabilities', () => {
    expect(
      modelCapabilities({
        model: 'm',
        capabilities: ['insert', 'vision'],
      }),
    ).toEqual(['vision']);
  });

  it('returns an empty list when none are supported', () => {
    expect(modelCapabilities({ model: 'm', capabilities: ['insert'] })).toEqual(
      [],
    );
  });

  it('returns an empty list when capabilities are missing', () => {
    expect(modelCapabilities({ model: 'm' })).toEqual([]);
  });
});
