import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAbortJob } from './use-abort-job';

const toastMocks = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/composables/use-toast/use-toast', () => ({
  useToast: () => toastMocks,
}));

describe('useAbortJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abortJob returns true on success and confirms via toast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }),
    );
    const { abortJob } = useAbortJob();

    const result = await abortJob('req-1');

    expect(result).toBe(true);
    expect(toastMocks.info).toHaveBeenCalledOnce();
  });

  it('abortJob returns false on non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, text: () => Promise.resolve('err') }),
    );
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { abortJob } = useAbortJob();

    const result = await abortJob('req-2');

    expect(result).toBe(false);
    expect(toastMocks.error).toHaveBeenCalledOnce();
    spyWarn.mockRestore();
  });

  it('abortJob returns false on exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));
    const spyErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { abortJob } = useAbortJob();

    const result = await abortJob('req-3');

    expect(result).toBe(false);
    expect(toastMocks.error).toHaveBeenCalledOnce();
    spyErr.mockRestore();
  });
});
