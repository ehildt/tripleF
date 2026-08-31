import { describe, expect, it } from 'vitest';

import { mapCapabilityToBadge } from './map-capability-to-badge.helper';

describe('mapCapabilityToBadge', () => {
  it('builds a capability badge from its key', () => {
    const badge = mapCapabilityToBadge('vision' as never);
    expect(badge.key).toBe('vision');
  });
});
