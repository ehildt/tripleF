import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useDlqReadState } from './use-dlq-read-state';

function entry(attemptsMade = 0): DlqEntry {
  return {
    id: 'record-1',
    failedAt: '2026-01-01T00:00:00Z',
    attemptsMade,
  } as DlqEntry;
}

describe('useDlqReadState', () => {
  beforeEach(() => localStorage.clear());

  it('marks and reads the composite entry version key', async () => {
    const readState = useDlqReadState();
    expect(readState.isEntryRead(entry())).toBe(false);

    readState.markEntryAsRead(entry());
    await nextTick();

    expect(readState.isEntryRead(entry())).toBe(true);
    expect(readState.isEntryRead(entry(1))).toBe(false);
    expect(localStorage.getItem('read-dlq-ids')).toContain('record-1');
  });
});
