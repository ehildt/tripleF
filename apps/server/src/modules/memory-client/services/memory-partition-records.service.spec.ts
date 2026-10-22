import { describe, expect, it, vi } from 'vitest';

import { MemoryPartitionRecordsService } from './memory-partition-records.service.js';

const transport = (enabled = true) => ({
  enabled,
  baseUrl: 'http://memory:3400/api/v1',
  request: vi.fn(),
});

describe('MemoryPartitionRecordsService', () => {
  describe('searchByText', () => {
    it('posts the probe input and returns the hits', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue([{ id: 'p1' }]);
      const service = new MemoryPartitionRecordsService(fakeTransport as never);

      await expect(
        service.searchByText({ memoryPartition: 'user-1' } as never),
      ).resolves.toEqual([{ id: 'p1' }]);
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/memory/search/text',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('degrades to empty when disabled or failing', async () => {
      const disabled = transport(false);
      const failing = transport();
      failing.request.mockRejectedValue(new Error('Memory service error 503'));
      const input = { memoryPartition: 'user-1' } as never;

      await expect(
        new MemoryPartitionRecordsService(disabled as never).searchByText(
          input,
        ),
      ).resolves.toEqual([]);
      await expect(
        new MemoryPartitionRecordsService(failing as never).searchByText(input),
      ).resolves.toEqual([]);
      expect(disabled.request).not.toHaveBeenCalled();
    });
  });

  describe('searchByTextWithClusters', () => {
    it('returns points plus clusters', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({
        points: [],
        clusters: [{ id: 'c1' }],
      });
      const service = new MemoryPartitionRecordsService(fakeTransport as never);

      await expect(
        service.searchByTextWithClusters({
          memoryPartition: 'user-1',
        } as never),
      ).resolves.toEqual({ points: [], clusters: [{ id: 'c1' }] });
    });

    it('degrades to an empty graph result when disabled or failing', async () => {
      const disabled = transport(false);
      const failing = transport();
      failing.request.mockRejectedValue(new Error('Memory service error 503'));
      const input = { memoryPartition: 'user-1' } as never;

      await expect(
        new MemoryPartitionRecordsService(
          disabled as never,
        ).searchByTextWithClusters(input),
      ).resolves.toEqual({ points: [], clusters: [] });
      await expect(
        new MemoryPartitionRecordsService(
          failing as never,
        ).searchByTextWithClusters(input),
      ).resolves.toEqual({ points: [], clusters: [] });
    });
  });

  describe('deleteRecords', () => {
    it('serializes the filter into the query string and reports the receipt', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({
        deleted: 2,
        texts: ['a', 'b'],
      });
      const service = new MemoryPartitionRecordsService(fakeTransport as never);

      await expect(
        service.deleteRecords({
          memoryPartition: 'user-1',
          text: 'a',
        } as never),
      ).resolves.toEqual({ deleted: 2, texts: ['a', 'b'], matched: 2 });
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/memory/text?memoryPartition=user-1&text=a',
        { method: 'DELETE' },
      );
    });

    it('throws the transport failure so the tool reports an honest error', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockRejectedValue(
        new Error('Memory service error 503'),
      );
      const service = new MemoryPartitionRecordsService(fakeTransport as never);

      await expect(
        service.deleteRecords({ memoryPartition: 'user-1' } as never),
      ).rejects.toThrow('Memory service error 503');
    });
  });
});
