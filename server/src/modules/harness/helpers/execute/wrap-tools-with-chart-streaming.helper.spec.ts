import { describe, expect, it, vi } from 'vitest';

import { wrapToolsWithChartStreaming } from './wrap-tools-with-chart-streaming.helper.js';

describe('wrapToolsWithChartStreaming', () => {
  it('returns tools unchanged when there is no handler', () => {
    const tools = { eodhdHistory: { execute: vi.fn() } };
    expect(wrapToolsWithChartStreaming(tools)).toBe(tools);
  });

  it('strips chartData and calls the handler', async () => {
    const onChartData = vi.fn();
    const execute = vi
      .fn()
      .mockResolvedValue({ summary: 'x', chartData: [1, 2, 3] });
    const wrapped = wrapToolsWithChartStreaming(
      { eodhdHistory: { execute } },
      onChartData,
    );
    const result = await (
      wrapped.eodhdHistory as {
        execute: (...args: unknown[]) => Promise<unknown>;
      }
    ).execute({});
    expect(result).toEqual({ summary: 'x' });
    expect(onChartData).toHaveBeenCalledWith('eodhdHistory', [1, 2, 3]);
  });

  it('leaves results without chartData unchanged', async () => {
    const onChartData = vi.fn();
    const execute = vi.fn().mockResolvedValue({ summary: 'x' });
    const wrapped = wrapToolsWithChartStreaming(
      { eodhdHistory: { execute } },
      onChartData,
    );
    const result = await (
      wrapped.eodhdHistory as {
        execute: (...args: unknown[]) => Promise<unknown>;
      }
    ).execute({});
    expect(result).toEqual({ summary: 'x' });
    expect(onChartData).not.toHaveBeenCalled();
  });
});
