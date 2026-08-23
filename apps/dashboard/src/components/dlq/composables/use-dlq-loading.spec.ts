import { describe, expect, it, vi } from 'vitest';

import { useDlqLoading } from './use-dlq-loading';

describe('useDlqLoading', () => {
  it('starts with showLoading false', () => {
    const { showLoading } = useDlqLoading({ refetch: vi.fn() });
    expect(showLoading.value).toBe(false);
  });

  it('guardedRefetch sets showLoading true and awaits the refetch', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    const { showLoading, guardedRefetch } = useDlqLoading({ refetch });
    const promise = guardedRefetch();
    expect(showLoading.value).toBe(true);
    await promise;
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('onError clears the loading state', () => {
    const { showLoading, onError } = useDlqLoading({ refetch: vi.fn() });
    showLoading.value = true;
    onError();
    expect(showLoading.value).toBe(false);
  });
});
