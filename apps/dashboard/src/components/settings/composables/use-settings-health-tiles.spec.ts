import { describe, expect, it, vi } from 'vitest';

import { useHealthReady } from '../../../api/queries/use-health-ready.query';
import { useSettingsHealthTiles } from './use-settings-health-tiles';

vi.mock('../../../api/queries/use-health-ready.query', () => ({
  useHealthReady: vi.fn(),
}));

function mockHealthState(
  state: Partial<{
    isLoading: boolean;
    isError: boolean;
    data: {
      info?: Record<string, { status: string }>;
      details?: Record<string, { status: string }>;
      error?: Record<string, { status: string }>;
    };
  }>,
) {
  vi.mocked(useHealthReady).mockReturnValue({
    data: { value: state.data ?? null },
    isLoading: { value: state.isLoading ?? false },
    isError: { value: state.isError ?? false },
  } as ReturnType<typeof useHealthReady>);
}

describe('useSettingsHealthTiles', () => {
  it('returns loading placeholders while loading', () => {
    mockHealthState({ isLoading: true });
    const { tiles } = useSettingsHealthTiles();
    expect(tiles.value).toHaveLength(6);
    expect(tiles.value.every((t) => t.loading)).toBe(true);
  });

  it('marks every tile as errored when the query fails', () => {
    mockHealthState({ isError: true });
    const { tiles } = useSettingsHealthTiles();
    expect(tiles.value.every((t) => t.error)).toBe(true);
    expect(tiles.value.every((t) => t.status === 'unknown')).toBe(true);
  });

  it('maps info entries to tiles and prefers detail status', () => {
    mockHealthState({
      data: {
        info: {
          ollama: { status: 'up' },
          postgres: { status: 'up' },
        },
        details: {
          postgres: { status: 'down' },
        },
        error: {
          ollama: { status: 'down' },
        },
      },
    });
    const { tiles } = useSettingsHealthTiles();
    const ollama = tiles.value.find((t) => t.key === 'ollama');
    const postgres = tiles.value.find((t) => t.key === 'postgres');

    expect(ollama?.status).toBe('up');
    expect(ollama?.error).toBe(true);
    expect(postgres?.status).toBe('down');
    expect(postgres?.error).toBe(false);
  });
});
