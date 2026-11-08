import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { getDlqEntryReadKey } from './get-dlq-entry-read-key.helper';

describe('getDlqEntryReadKey', () => {
  it('includes record id, failure time, and attempt count', () => {
    expect(
      getDlqEntryReadKey({
        id: 'record-1',
        failedAt: '2026-01-01T00:00:00Z',
        attemptsMade: 2,
      } as DlqEntry),
    ).toBe('record-1::2026-01-01T00:00:00Z::2');
  });

  it('uses an empty failure segment when failedAt is absent', () => {
    expect(
      getDlqEntryReadKey({
        id: 'record-1',
        failedAt: null,
        attemptsMade: 0,
      } as DlqEntry),
    ).toBe('record-1::::0');
  });
});
