import { describe, expect, it, vi } from 'vitest';

import { createTrackingPromise } from './create-tracking-promise.helper';

describe('createTrackingPromise', () => {
  it('wraps promise with startTime', () => {
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(50) });
    const p = Promise.resolve({ ok: true } as Response);
    const tracking = createTrackingPromise(p);
    expect(tracking.promise).toBe(p);
    expect(tracking.startTime).toBe(50);
    vi.unstubAllGlobals();
  });
});
