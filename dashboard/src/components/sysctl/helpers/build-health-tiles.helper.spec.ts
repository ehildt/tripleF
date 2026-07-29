import { describe, expect, it } from 'vitest';

import type { HealthResponse } from '@/api/queries/use-health-ready.query.type';

import { buildHealthTiles } from './build-health-tiles.helper';

const TRACKED = ['disk', 'ollama', 'memory_heap', 'memory_rss'] as const;

function healthResponse(
  overrides: Partial<HealthResponse> = {},
): HealthResponse {
  return {
    status: 'ok',
    info: {
      disk: { status: 'up' },
      ollama: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
    },
    error: {},
    details: {
      disk: { status: 'up' },
      ollama: { status: 'up' },
      memory_heap: { status: 'up' },
      memory_rss: { status: 'up' },
    },
    ...overrides,
  };
}

describe('buildHealthTiles', () => {
  it('maps loading to tracked loading tiles', () => {
    expect(buildHealthTiles(undefined, true, false, TRACKED)).toEqual([
      { key: 'disk', status: 'loading', loading: true, error: false },
      { key: 'ollama', status: 'loading', loading: true, error: false },
      { key: 'memory_heap', status: 'loading', loading: true, error: false },
      { key: 'memory_rss', status: 'loading', loading: true, error: false },
    ]);
  });

  it('maps a query error to tracked unknown tiles', () => {
    const tiles = buildHealthTiles(undefined, false, true, TRACKED);
    expect(tiles).toHaveLength(TRACKED.length);
    expect(tiles.every((tile) => tile.error && tile.status === 'unknown')).toBe(
      true,
    );
  });

  it('maps an all-up response to up tiles without errors', () => {
    const tiles = buildHealthTiles(healthResponse(), false, false, TRACKED);
    expect(tiles).toHaveLength(4);
    expect(tiles.find((tile) => tile.key === 'memory_rss')).toEqual({
      key: 'memory_rss',
      status: 'up',
      loading: false,
      error: false,
    });
  });

  it('keeps a down indicator visible for the 503 response shape', () => {
    // terminus answers failed checks with 503 and moves them into `error`
    const tiles = buildHealthTiles(
      healthResponse({
        status: 'error',
        info: {
          disk: { status: 'up' },
          ollama: { status: 'up' },
          memory_heap: { status: 'up' },
        },
        error: { memory_rss: { status: 'down' } },
        details: {
          disk: { status: 'up' },
          ollama: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'down' },
        },
      }),
      false,
      false,
      TRACKED,
    );
    expect(tiles.find((tile) => tile.key === 'memory_rss')).toEqual({
      key: 'memory_rss',
      status: 'down',
      loading: false,
      error: true,
    });
    expect(tiles).toHaveLength(4);
  });

  it('also surfaces indicators present only under info', () => {
    const tiles = buildHealthTiles(
      healthResponse({
        info: { custom: { status: 'up' } },
        details: {},
      }),
      false,
      false,
      TRACKED,
    );
    expect(tiles.some((tile) => tile.key === 'custom')).toBe(true);
  });

  it('returns an empty list without data', () => {
    expect(buildHealthTiles(undefined, false, false, TRACKED)).toEqual([]);
  });
});
