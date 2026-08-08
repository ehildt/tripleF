import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import type { DebugResult } from '../../../types/debug.model';
import type { DebugProps } from '../Debug.types';
import { useDebugFilters } from './use-debug-filters.composable';

function result(id: string, type: 'http' | 'socket'): DebugResult {
  return {
    id,
    timestamp: '2026-01-01T00:00:00Z',
    endpoint: '/api',
    method: 'GET',
    status: 'success',
    responseTime: 1,
    type,
  };
}

function makeProps(results: DebugResult[]): DebugProps {
  return reactive({ results, selectedResult: null });
}

describe('useDebugFilters', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts with all results', () => {
    const props = makeProps([result('1', 'http'), result('2', 'socket')]);
    const { filteredResults } = useDebugFilters(props);
    expect(filteredResults.value.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('filters by type', () => {
    const props = makeProps([result('1', 'http'), result('2', 'socket')]);
    const { filter, filteredResults } = useDebugFilters(props);

    filter.value = 'http';
    expect(filteredResults.value.map((r) => r.id)).toEqual(['1']);

    filter.value = 'socket';
    expect(filteredResults.value.map((r) => r.id)).toEqual(['2']);
  });

  it('filters by search text', () => {
    const props = makeProps([
      { ...result('1', 'http'), endpoint: '/api/health' },
      { ...result('2', 'http'), endpoint: '/api/chat' },
    ]);
    const { search, filteredResults } = useDebugFilters(props);

    search.value = 'health';
    expect(filteredResults.value.map((r) => r.id)).toEqual(['1']);
  });

  it('counts results per type', () => {
    const props = makeProps([
      result('1', 'http'),
      result('2', 'http'),
      result('3', 'socket'),
    ]);
    const { httpCount, socketCount } = useDebugFilters(props);
    expect(httpCount.value).toBe(2);
    expect(socketCount.value).toBe(1);
  });
});
