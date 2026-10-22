import { describe, expect, it } from 'vitest';

import type { DebugResult } from '@/types/debug.model';

import { buildFilteredDebugResults } from './build-filtered-debug-results.helper';

function result(overrides: Partial<DebugResult> = {}): DebugResult {
  return { id: 'x', epoch: 0, ...overrides } as DebugResult;
}

describe('buildFilteredDebugResults', () => {
  const isRead = (id: string) => id === 'read-1';

  it('filters by type', () => {
    const filtered = buildFilteredDebugResults(
      [
        result({ id: 'a', type: 'request' }),
        result({ id: 'b', type: 'socket' }),
      ],
      { filter: 'request', hideRead: false, search: '', isRead },
    );
    expect(filtered.map((r) => r.id)).toEqual(['a']);
  });

  it('hides read entries when hideRead is on', () => {
    const filtered = buildFilteredDebugResults(
      [result({ id: 'read-1' }), result({ id: 'unread-1' })],
      { filter: 'all', hideRead: true, search: '', isRead },
    );
    expect(filtered.map((r) => r.id)).toEqual(['unread-1']);
  });

  it('matches the search across endpoint, model, requestId, event, room, method', () => {
    const filtered = buildFilteredDebugResults(
      [
        result({ id: 'a', endpoint: '/api/harness' }),
        result({ id: 'b', endpoint: '/other', model: 'llama3' }),
      ],
      { filter: 'all', hideRead: false, search: 'llama', isRead },
    );
    expect(filtered.map((r) => r.id)).toEqual(['b']);
  });

  it('sorts unread-first, then newest-first within each group', () => {
    const filtered = buildFilteredDebugResults(
      [
        result({ id: 'read-1', epoch: 5 }),
        result({ id: 'unread-old', epoch: 1 }),
        result({ id: 'unread-new', epoch: 9 }),
      ],
      { filter: 'all', hideRead: false, search: '', isRead },
    );
    expect(filtered.map((r) => r.id)).toEqual([
      'unread-new',
      'unread-old',
      'read-1',
    ]);
  });
});
