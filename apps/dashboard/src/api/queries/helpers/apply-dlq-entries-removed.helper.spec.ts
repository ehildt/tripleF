import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';

import { applyDlqEntriesRemoved } from './apply-dlq-entries-removed.helper';

function entry(id: string): DlqEntry {
  return { id } as DlqEntry;
}

describe('applyDlqEntriesRemoved', () => {
  it('drops listed ids and decrements the cached total', () => {
    const current: DlqListResponse = {
      data: [entry('a'), entry('b')],
      total: 2,
      limit: 20,
      offset: 0,
    };

    const next = applyDlqEntriesRemoved(current, ['a']);

    expect(next.data.map((item) => item.id)).toEqual(['b']);
    expect(next.total).toBe(1);
    expect(current.data).toHaveLength(2);
  });

  it('returns the same page when no listed id exists', () => {
    const current: DlqListResponse = {
      data: [entry('a')],
      total: 1,
      limit: 20,
      offset: 0,
    };
    expect(applyDlqEntriesRemoved(current, ['missing'])).toBe(current);
  });
});
