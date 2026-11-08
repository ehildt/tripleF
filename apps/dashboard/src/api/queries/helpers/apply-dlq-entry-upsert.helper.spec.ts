import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';
import type { DlqListResponse } from '@/types/dlq-list-response.model';

import { applyDlqEntryUpsert } from './apply-dlq-entry-upsert.helper';

function entry(id: string, status: DlqEntry['status'] = 'Failed'): DlqEntry {
  return {
    id,
    queueName: 'harness',
    jobName: id,
    status,
    payload: null,
    failedReason: null,
  } as DlqEntry;
}

function response(
  data: DlqEntry[],
  total = data.length,
  offset = 0,
): DlqListResponse {
  return { data, total, limit: 2, offset };
}

describe('applyDlqEntryUpsert', () => {
  it('inserts a matching entry on page one and caps the page size', () => {
    const current = response([entry('a'), entry('b')]);

    const next = applyDlqEntryUpsert(current, entry('c'), {});

    expect(next.data.map((item) => item.id)).toEqual(['c', 'a']);
    expect(next.total).toBe(3);
    expect(current.data.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('replaces an existing entry without changing the total', () => {
    const next = applyDlqEntryUpsert(
      response([entry('a')]),
      entry('a', 'Cleared'),
      {},
    );

    expect(next.data[0].status).toBe('Cleared');
    expect(next.total).toBe(1);
  });

  it('removes an existing entry that no longer matches the filters', () => {
    const next = applyDlqEntryUpsert(
      response([entry('a')]),
      entry('a', 'Cleared'),
      { status: 'Failed' },
    );

    expect(next.data).toEqual([]);
    expect(next.total).toBe(0);
  });

  it('increments totals but does not insert beyond page one', () => {
    const current = response([], 20, 20);
    const next = applyDlqEntryUpsert(current, entry('a'), {});

    expect(next.data).toEqual([]);
    expect(next.total).toBe(21);
  });

  it('leaves a nonmatching new entry and the original page unchanged', () => {
    const current = response([entry('a')]);
    const next = applyDlqEntryUpsert(current, entry('b', 'Cleared'), {
      status: 'Failed',
    });

    expect(next).toBe(current);
  });
});
