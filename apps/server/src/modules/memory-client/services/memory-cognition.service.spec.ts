import { describe, expect, it, vi } from 'vitest';

import { EMPTY_MEMORY_COGNITION_SNAPSHOT } from '../constants/memory-client.constants.js';

import { MemoryCognitionService } from './memory-cognition.service.js';

const transport = (enabled = true) => ({
  enabled,
  baseUrl: 'http://memory:3400/api/v1',
  request: vi.fn(),
});

describe('MemoryCognitionService', () => {
  describe('getCognition', () => {
    it('reads the snapshot for the encoded cognition space key', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({ profile: { name: 'Ada' } });
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(service.getCognition('ai space/1')).resolves.toEqual({
        profile: { name: 'Ada' },
      });
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/memory/cognition?memoryCognition=ai%20space%2F1',
      );
    });

    it('presents a fresh cognition space when disabled', async () => {
      const fakeTransport = transport(false);
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(service.getCognition('ai-1')).resolves.toBe(
        EMPTY_MEMORY_COGNITION_SNAPSHOT,
      );
      expect(fakeTransport.request).not.toHaveBeenCalled();
    });

    it('degrades to the empty snapshot on a memory outage', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockRejectedValue(
        new Error('Memory service error 503'),
      );
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(service.getCognition('ai-1')).resolves.toBe(
        EMPTY_MEMORY_COGNITION_SNAPSHOT,
      );
    });
  });

  describe('searchConvictions', () => {
    it('returns hits and degrades to empty on failure', async () => {
      const hits = transport();
      hits.request.mockResolvedValue([{ id: 'c1' }]);
      const failing = transport();
      failing.request.mockRejectedValue(new Error('Memory service error 503'));
      const input = { memoryCognition: 'ai-1' } as never;

      await expect(
        new MemoryCognitionService(hits as never).searchConvictions(input),
      ).resolves.toEqual([{ id: 'c1' }]);
      await expect(
        new MemoryCognitionService(failing as never).searchConvictions(input),
      ).resolves.toEqual([]);
    });
  });

  describe('deleteCognition', () => {
    it('wipes the cognition lane through the flag-filtered text endpoint', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({ deleted: 1, texts: ['x'] });
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(service.deleteCognition('ai-1')).resolves.toEqual(['x']);
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/memory/text?memoryPartition=ai-1&cognition=true',
        { method: 'DELETE' },
      );
    });
  });

  describe('deleteCognitionRecords', () => {
    it('targets one text and/or path inside the cognition lane', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({
        deleted: 1,
        texts: ['x'],
        pruned: ['likes.jazz'],
      });
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(
        service.deleteCognitionRecords({
          memoryCognition: 'ai-1',
          text: 'x',
          path: 'likes.jazz',
        } as never),
      ).resolves.toEqual({ deleted: 1, texts: ['x'], pruned: ['likes.jazz'] });
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/memory/text?memoryPartition=ai-1&cognition=true&text=x&path=likes.jazz',
        { method: 'DELETE' },
      );
    });

    it('reports no pruned paths when the receipt omits them', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({ deleted: 0, texts: [] });
      const service = new MemoryCognitionService(fakeTransport as never);

      await expect(
        service.deleteCognitionRecords({ memoryCognition: 'ai-1' } as never),
      ).resolves.toEqual({ deleted: 0, texts: [], pruned: [] });
    });

    it('throws when disabled', async () => {
      const service = new MemoryCognitionService(transport(false) as never);

      await expect(
        service.deleteCognitionRecords({ memoryCognition: 'ai-1' } as never),
      ).rejects.toThrow('Memory feature is disabled');
    });
  });
});
