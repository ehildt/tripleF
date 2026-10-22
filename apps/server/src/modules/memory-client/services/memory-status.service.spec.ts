import { describe, expect, it, vi } from 'vitest';

import { MemoryStatusService } from './memory-status.service.js';

const transport = () => ({
  baseUrl: 'http://memory:3400/api/v1',
  request: vi.fn().mockResolvedValue({ status: 'green' }),
});

describe('MemoryStatusService', () => {
  it('reads the memory status endpoint', async () => {
    const fakeTransport = transport();
    const service = new MemoryStatusService(fakeTransport as never);

    await expect(service.status()).resolves.toEqual({ status: 'green' });
    expect(fakeTransport.request).toHaveBeenCalledWith(
      'http://memory:3400/api/v1/memory/status',
    );
  });

  it('propagates failures so readiness reports the outage', async () => {
    const fakeTransport = transport();
    fakeTransport.request.mockRejectedValue(
      new Error('Memory service error 503'),
    );
    const service = new MemoryStatusService(fakeTransport as never);

    await expect(service.status()).rejects.toThrow('Memory service error 503');
  });
});
