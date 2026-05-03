import { describe, expect, it } from 'vitest';

import { getStatusColors } from './get-status-colors.helper';

describe('getStatusColors', () => {
  it('returns success colors', () => {
    const c = getStatusColors('success');
    expect(c.text).toBe('text-status-success');
    expect(c.bg).toContain('status-success');
  });

  it('returns error colors', () => {
    const c = getStatusColors('error');
    expect(c.text).toBe('text-status-error');
    expect(c.bg).toContain('status-error');
  });
});
