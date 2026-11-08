import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';

import { replaceDlqEntry } from './replace-dlq-entry.helper';

function entry(id: string, status: DlqEntry['status'] = 'Failed'): DlqEntry {
  return { id, status } as DlqEntry;
}

describe('replaceDlqEntry', () => {
  const current: DlqListResponse = {
    data: [entry('a')],
    total: 1,
    limit: 20,
    offset: 0,
  };

  it('replaces the matching mutation result immutably', () => {
    const next = replaceDlqEntry(current, entry('a', 'Cleared'));

    expect(next.data[0].status).toBe('Cleared');
    expect(next.total).toBe(1);
    expect(current.data[0].status).toBe('Failed');
  });

  it('returns the original page when the record is absent', () => {
    expect(replaceDlqEntry(current, entry('missing'))).toBe(current);
  });
});
