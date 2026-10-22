import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryEncyclopediaService } from './memory-encyclopedia.service.js';

const transport = (enabled = true) => ({
  enabled,
  baseUrl: 'http://memory:3400/api/v1',
  request: vi.fn(),
});

describe('MemoryEncyclopediaService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchEncyclopedia', () => {
    it('returns hits for the posted query', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue([{ id: 'h1' }]);
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.searchEncyclopedia({ query: 'jazz' } as never),
      ).resolves.toEqual([{ id: 'h1' }]);
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/encyclopedia/search',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('degrades to empty when disabled or failing', async () => {
      const disabled = transport(false);
      const failing = transport();
      failing.request.mockRejectedValue(new Error('Memory service error 503'));

      await expect(
        new MemoryEncyclopediaService(disabled as never).searchEncyclopedia({
          query: 'jazz',
        } as never),
      ).resolves.toEqual([]);
      await expect(
        new MemoryEncyclopediaService(failing as never).searchEncyclopedia({
          query: 'jazz',
        } as never),
      ).resolves.toEqual([]);
    });
  });

  describe('readEncyclopediaDocument', () => {
    it('returns the document window and degrades to null', async () => {
      const ok = transport();
      ok.request.mockResolvedValue({ chunks: [] });
      const failing = transport();
      failing.request.mockRejectedValue(new Error('Memory service error 404'));

      await expect(
        new MemoryEncyclopediaService(ok as never).readEncyclopediaDocument({
          url: 'https://example.com/a',
        } as never),
      ).resolves.toEqual({ chunks: [] });
      await expect(
        new MemoryEncyclopediaService(
          failing as never,
        ).readEncyclopediaDocument({
          url: 'https://example.com/a',
        } as never),
      ).resolves.toBeNull();
      await expect(
        new MemoryEncyclopediaService(
          transport(false) as never,
        ).readEncyclopediaDocument({
          url: 'https://example.com/a',
        } as never),
      ).resolves.toBeNull();
    });
  });

  describe('selectContext', () => {
    it('returns the selection and warns before degrading to null', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({ chunks: [{ id: 'c1' }] });
      const warn = vi.spyOn(Logger.prototype, 'warn');
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.selectContext({ query: 'jazz' } as never),
      ).resolves.toEqual({
        chunks: [{ id: 'c1' }],
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it('degrades to null with a warning when the selection fails', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockRejectedValue(
        new Error('Memory service error 503'),
      );
      const warn = vi.spyOn(Logger.prototype, 'warn');
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.selectContext({ query: 'jazz' } as never),
      ).resolves.toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('encyclopedia select failed'),
      );
    });
  });

  describe('indexEncyclopediaDocuments', () => {
    it('returns the index outcome', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockResolvedValue({ indexed: 2 });
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.indexEncyclopediaDocuments({ documents: [] } as never),
      ).resolves.toEqual({ indexed: 2 });
      expect(fakeTransport.request).toHaveBeenCalledWith(
        'http://memory:3400/api/v1/encyclopedia/index',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('degrades to null with a warning so an outage never breaks the turn', async () => {
      const fakeTransport = transport();
      fakeTransport.request.mockRejectedValue(
        new Error('Memory service error 503'),
      );
      const warn = vi.spyOn(Logger.prototype, 'warn');
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.indexEncyclopediaDocuments({ documents: [] } as never),
      ).resolves.toBeNull();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('encyclopedia index failed'),
      );
    });

    it('skips the call entirely when memory is disabled', async () => {
      const fakeTransport = transport(false);
      const service = new MemoryEncyclopediaService(fakeTransport as never);

      await expect(
        service.indexEncyclopediaDocuments({ documents: [] } as never),
      ).resolves.toBeNull();
      expect(fakeTransport.request).not.toHaveBeenCalled();
    });
  });
});
