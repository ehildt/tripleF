import { describe, expect, it, vi } from 'vitest';

import { MemorySynopsesService } from './memory-synopses.service.js';

const transport = (enabled = true) => ({
  enabled,
  baseUrl: 'http://memory:3400/api/v1',
  request: vi.fn().mockResolvedValue([{ id: 's1' }]),
});

describe('MemorySynopsesService', () => {
  it('posts the probe input to the synopses endpoint', async () => {
    const fakeTransport = transport();
    const service = new MemorySynopsesService(fakeTransport as never);
    const input = { memoryPartition: 'user-1', text: 'jazz', limit: 3 };

    await expect(service.searchSynopses(input)).resolves.toEqual([
      { id: 's1' },
    ]);
    expect(fakeTransport.request).toHaveBeenCalledWith(
      'http://memory:3400/api/v1/memory/search/synopses',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
  });

  it('returns nothing without calling out when memory is disabled', async () => {
    const fakeTransport = transport(false);
    const service = new MemorySynopsesService(fakeTransport as never);

    await expect(
      service.searchSynopses({ memoryPartition: 'user-1', text: 'jazz' }),
    ).resolves.toEqual([]);
    expect(fakeTransport.request).not.toHaveBeenCalled();
  });

  it('degrades to an empty result on a memory outage', async () => {
    const fakeTransport = transport();
    fakeTransport.request.mockRejectedValue(
      new Error('Memory service error 503'),
    );
    const service = new MemorySynopsesService(fakeTransport as never);

    await expect(
      service.searchSynopses({ memoryPartition: 'user-1', text: 'jazz' }),
    ).resolves.toEqual([]);
  });
});
