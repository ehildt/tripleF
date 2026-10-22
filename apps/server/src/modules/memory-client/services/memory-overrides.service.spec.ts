import { describe, expect, it, vi } from 'vitest';

import { MemoryOverridesService } from './memory-overrides.service.js';

describe('MemoryOverridesService', () => {
  it('reads the memory app system variables endpoint', async () => {
    const request = vi.fn().mockResolvedValue({ cognitionLimit: 5 });
    const service = new MemoryOverridesService({
      baseUrl: 'http://memory:3400/api/v1',
      request,
    } as never);

    await expect(service.getOverrides()).resolves.toEqual({
      cognitionLimit: 5,
    });
    expect(request).toHaveBeenCalledWith(
      'http://memory:3400/api/v1/memory-overrides',
    );
  });

  it('propagates failures so the caller can degrade to built-in defaults', async () => {
    const service = new MemoryOverridesService({
      baseUrl: 'http://memory:3400/api/v1',
      request: vi.fn().mockRejectedValue(new Error('Memory service error 500')),
    } as never);

    await expect(service.getOverrides()).rejects.toThrow(
      'Memory service error 500',
    );
  });
});
