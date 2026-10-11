import { describe, expect, it } from 'vitest';

import { toUtcIso } from './to-utc-iso.helper';

describe('toUtcIso', () => {
  it('replaces the space separator with T and appends Z', () => {
    expect(toUtcIso('2024-01-01 12:00:00')).toBe('2024-01-01T12:00:00Z');
  });

  it('appends Z to a bare date-time without a zone', () => {
    expect(toUtcIso('2024-01-01T12:00:00')).toBe('2024-01-01T12:00:00Z');
  });

  it('leaves an already-zoned string unchanged', () => {
    expect(toUtcIso('2024-01-01T12:00:00+02:00')).toBe(
      '2024-01-01T12:00:00+02:00',
    );
  });
});
