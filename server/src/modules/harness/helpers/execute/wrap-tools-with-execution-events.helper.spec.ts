import { describe, expect, it, vi } from 'vitest';

import { wrapToolsWithExecutionEvents } from './wrap-tools-with-execution-events.helper.js';

describe('wrapToolsWithExecutionEvents', () => {
  it('returns tools unchanged when there is no handler', () => {
    const tools = { webSearch: { execute: vi.fn() } };
    expect(wrapToolsWithExecutionEvents(tools)).toBe(tools);
  });

  it('fires start and done events around execution', async () => {
    const onToolEvent = vi.fn();
    const execute = vi.fn().mockResolvedValue('ok');
    const wrapped = wrapToolsWithExecutionEvents(
      { webSearch: { execute } },
      onToolEvent,
    );
    const result = await (
      wrapped.webSearch as {
        execute: (...args: unknown[]) => Promise<unknown>;
      }
    ).execute({ query: 'hello' });
    expect(result).toBe('ok');
    expect(onToolEvent).toHaveBeenNthCalledWith(1, {
      name: 'webSearch',
      category: 'web',
      query: 'hello',
      input: { query: 'hello' },
      status: 'start',
    });
    expect(onToolEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'done' }),
    );
  });

  it('fires an error event and rethrows', async () => {
    const onToolEvent = vi.fn();
    const execute = vi.fn().mockRejectedValue(new Error('boom'));
    const wrapped = wrapToolsWithExecutionEvents(
      { webSearch: { execute } },
      onToolEvent,
    );
    await expect(
      (
        wrapped.webSearch as {
          execute: (...args: unknown[]) => Promise<unknown>;
        }
      ).execute({}),
    ).rejects.toThrow('boom');
    expect(onToolEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('leaves tools without an execute function unchanged', () => {
    const tools = { webSearch: { description: 'x' } };
    const wrapped = wrapToolsWithExecutionEvents(tools, vi.fn());
    expect(wrapped.webSearch).toBe(tools.webSearch);
  });
});
