import { Logger } from '@nestjs/common';
import { createOllama } from 'ollama-ai-provider-v2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OLLAMA_CLOUD_HOST } from './ollama-api.constants.ts';
import type { OllamaApiConfig } from './ollama-api.model.ts';
import { OllamaApiService } from './ollama-api.service.ts';

vi.mock('ollama-ai-provider-v2', () => ({
  createOllama: vi.fn((options: unknown) => {
    const provider = (name: string) => ({ name, options });
    return provider;
  }),
}));

const createOllamaMock = vi.mocked(createOllama);

const LOCAL_HOST = '127.0.0.1';
const CLOUD_TAGS = `${OLLAMA_CLOUD_HOST}/tags`;

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as unknown as Response;

const tagsResponse = (models: Array<Record<string, unknown>>): Response => jsonResponse({ models });

const showResponse = (body: Record<string, unknown>): Response => jsonResponse(body);

const buildConfig = (overrides: Partial<OllamaApiConfig> = {}): OllamaApiConfig => ({
  resolveConnection: () => ({ host: LOCAL_HOST, apiKey: undefined }),
  modelsCacheTtlMs: 300_000,
  showCacheTtlMs: 300_000,
  ...overrides,
});

const buildService = (overrides: Partial<OllamaApiConfig> = {}) => new OllamaApiService(buildConfig(overrides));

/**
 * Routes fetches by URL: `/tags` returns the tag list, `/show` returns the
 * show payload for the requested model name.
 */
const mockFetch = (
  routes: {
    localTags?: Response | (() => Response | Promise<Response>);
    cloudTags?: Response | (() => Response | Promise<Response>);
    show?: (name: string, url: string) => Response | Promise<Response>;
  } = {},
) => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.endsWith('/tags')) {
      const route = url === CLOUD_TAGS ? routes.cloudTags : routes.localTags;
      if (!route) return tagsResponse([]);
      return typeof route === 'function' ? route() : route;
    }
    const name = init?.body ? (JSON.parse(String(init.body)) as { name: string }).name : '';
    return routes.show ? routes.show(name, url) : showResponse({ capabilities: ['completion'] });
  });
  return fetchMock;
};

describe('OllamaApiService catalog, routing and caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOllamaMock.mockImplementation((options: unknown) => ((name: string) => ({ name, options })) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('catalog cache', () => {
    it('serves the cached catalog until the TTL expires', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'cached:latest' }]) });
      const service = buildService({ modelsCacheTtlMs: 300_000 });

      await service.getModels();
      const second = await service.getModels();

      expect(second.models.map((m) => m.model)).toEqual(['cached:latest']);
      expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/tags'))).toHaveLength(1);
    });

    it('refetches once the cache has expired', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'cached:latest' }]) });
      const service = buildService({ modelsCacheTtlMs: -1 });

      await service.getModels();
      await service.getModels();

      expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/tags'))).toHaveLength(2);
    });
  });

  describe('cloud catalog merge', () => {
    it('merges cloud models into the local catalog and dedupes by name', async () => {
      const fetchMock = mockFetch({
        localTags: tagsResponse([{ model: 'local:latest', details: { family: 'llama' } }]),
        cloudTags: tagsResponse([{ model: 'cloud:latest' }, { model: 'local:latest' }]),
      });
      const service = buildService({
        resolveConnection: () => ({ host: LOCAL_HOST, apiKey: 'secret-key' }),
      });

      const { models } = await service.getModels();

      expect(models.map((m) => [m.model, m.origin])).toEqual([
        ['local:latest', 'local'],
        ['cloud:latest', 'cloud'],
      ]);
      expect(fetchMock).toHaveBeenCalledWith(CLOUD_TAGS, {
        headers: { Authorization: 'Bearer secret-key' },
      });
    });

    it('falls back to the local catalog when the cloud catalog never responds', async () => {
      vi.useFakeTimers();
      const fetchMock = mockFetch({
        localTags: tagsResponse([{ model: 'local:latest' }]),
        cloudTags: () => {
          throw new Error('cloud down');
        },
      });
      const service = buildService({
        resolveConnection: () => ({ host: LOCAL_HOST, apiKey: 'secret-key' }),
      });

      const pending = service.getModels();
      await vi.advanceTimersByTimeAsync(5_000);
      const { models } = await pending;

      expect(models.map((m) => m.model)).toEqual(['local:latest']);
      expect(fetchMock.mock.calls.filter(([url]) => String(url) === CLOUD_TAGS)).toHaveLength(3);
    });

    it('succeeds on a retry without dropping the cloud catalog', async () => {
      vi.useFakeTimers();
      let attempts = 0;
      mockFetch({
        localTags: tagsResponse([]),
        cloudTags: () => {
          attempts += 1;
          if (attempts < 2) throw new Error('cold start');
          return tagsResponse([{ model: 'cloud:latest' }]);
        },
      });
      const service = buildService({
        resolveConnection: () => ({ host: LOCAL_HOST, apiKey: 'secret-key' }),
      });

      const pending = service.getModels();
      await vi.advanceTimersByTimeAsync(1_000);
      const { models } = await pending;

      expect(attempts).toBe(2);
      expect(models.map((m) => [m.model, m.origin])).toEqual([['cloud:latest', 'cloud']]);
    });

    it('treats a tags payload without a models array as an empty catalog', async () => {
      mockFetch({ localTags: jsonResponse({}) });
      const service = buildService();

      const { models } = await service.getModels();

      expect(models).toEqual([]);
    });

    it('surfaces a non-Error cloud failure in the warning', async () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(Logger.prototype, 'warn');
      mockFetch({
        localTags: tagsResponse([{ model: 'local:latest' }]),
        cloudTags: () => {
          throw 'gateway timeout';
        },
      });
      const service = buildService({
        resolveConnection: () => ({ host: LOCAL_HOST, apiKey: 'secret-key' }),
      });

      const pending = service.getModels();
      await vi.advanceTimersByTimeAsync(5_000);
      await pending;

      expect(warn).toHaveBeenCalledWith('Ollama Cloud catalog unavailable: gateway timeout');
    });

    it('treats an already-cloud host as one catalog and skips the second fetch', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'cloud-only:latest' }]) });
      const service = buildService({
        resolveConnection: () => ({ host: `${OLLAMA_CLOUD_HOST}/`, apiKey: 'secret-key' }),
      });

      const { models } = await service.getModels();

      expect(models.map((m) => [m.model, m.origin])).toEqual([['cloud-only:latest', 'cloud']]);
      expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/tags'))).toHaveLength(1);
    });

    it('skips the cloud catalog when no API key is configured', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'local:latest' }]) });
      const service = buildService();

      await service.getModels();

      expect(fetchMock.mock.calls.filter(([url]) => String(url) === CLOUD_TAGS)).toHaveLength(0);
    });
  });

  describe('tag fetching', () => {
    it('builds the tags URL for a host that already carries a scheme', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'local:latest' }]) });
      const service = buildService({
        resolveConnection: () => ({ host: 'http://ollama.internal:11434' }),
      });

      await service.getModels();

      expect(fetchMock).toHaveBeenCalledWith('http://ollama.internal:11434/tags', {
        headers: undefined,
      });
    });

    it('reports the HTTP status when the tags endpoint fails', async () => {
      mockFetch({ localTags: jsonResponse({}, false, 503) });
      const service = buildService();

      await expect(service.getModels()).rejects.toThrow('Ollama API error: 503');
    });

    it('builds the show URL from a schemed host and posts the model name', async () => {
      const fetchMock = mockFetch({
        localTags: tagsResponse([]),
        show: () => showResponse({ capabilities: ['tools'] }),
      });
      const service = buildService({
        resolveConnection: () => ({ host: 'http://ollama.internal:11434' }),
      });

      await service.supportsCapability('some:latest', 'tools');

      expect(fetchMock).toHaveBeenCalledWith('http://ollama.internal:11434/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'some:latest' }),
      });
    });
  });

  describe('show cache', () => {
    it('reuses the cached /show payload for repeated capability checks', async () => {
      const fetchMock = mockFetch({
        show: () => showResponse({ capabilities: ['vision'] }),
      });
      const service = buildService();

      await service.supportsCapability('model:latest', 'vision');
      await service.supportsCapability('model:latest', 'completion');

      expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/show'))).toHaveLength(1);
    });

    it('returns null and stops caching when the show request throws', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('socket hang up'));
      const service = buildService();

      await expect(service.supportsCapability('model:latest', 'vision')).resolves.toBe(false);
    });

    it('returns false when the show endpoint answers with an error status', async () => {
      mockFetch({ show: () => jsonResponse({}, false, 404) });
      const service = buildService();

      await expect(service.supportsCapability('model:latest', 'tools')).resolves.toBe(false);
    });
  });

  describe('context length extraction', () => {
    it('omits the context length when the show payload has no model_info', async () => {
      mockFetch({ localTags: tagsResponse([{ model: 'no-info:latest' }]), show: () => showResponse({}) });
      const service = buildService();

      const { models } = await service.getModels();

      expect(models[0].context_length).toBeUndefined();
    });

    it('omits the context length when no context_length key exists', async () => {
      mockFetch({
        localTags: tagsResponse([{ model: 'other-info:latest' }]),
        show: () => showResponse({ model_info: { 'llama.embedding_length': 4096 } }),
      });
      const service = buildService();

      const { models } = await service.getModels();

      expect(models[0].context_length).toBeUndefined();
    });

    it('coerces a numeric string context length', async () => {
      mockFetch({
        localTags: tagsResponse([{ model: 'string-info:latest' }]),
        show: () => showResponse({ model_info: { 'llama.context_length': '8192' } }),
      });
      const service = buildService();

      const { models } = await service.getModels();

      expect(models[0].context_length).toBe(8192);
    });

    it('omits the context length when the value is not numeric', async () => {
      mockFetch({
        localTags: tagsResponse([{ model: 'bad-info:latest' }]),
        show: () => showResponse({ model_info: { 'llama.context_length': 'unknown' } }),
      });
      const service = buildService();

      const { models } = await service.getModels();

      expect(models[0].context_length).toBeUndefined();
    });
  });

  describe('vision fallback', () => {
    const expectVision = async (modelInfo: Record<string, unknown>, expected: boolean) => {
      mockFetch({ show: () => showResponse({ model_info: modelInfo }) });
      const service = buildService();

      await expect(service.supportsCapability('legacy:latest', 'vision')).resolves.toBe(expected);
    };

    it('is false without model_info', async () => {
      await expectVision({}, false);
    });

    it('detects a projector key', async () => {
      await expectVision({ 'llama.projector_type': 'mlp' }, true);
    });

    it('detects a clip key', async () => {
      await expectVision({ 'clip.has_vision_encoder': true }, true);
    });

    it('detects a nested vision key', async () => {
      await expectVision({ 'llama.vision.head_count': 8 }, true);
    });

    it('ignores unrelated model_info keys', async () => {
      await expectVision({ 'llama.block_count': 32 }, false);
    });
  });

  describe('origin routing', () => {
    it('defaults unknown models to the local origin', () => {
      const service = buildService();

      expect(service.getModelOrigin('never-seen:latest')).toBe('local');
    });

    it('routes a cloud model at the Ollama Cloud host', async () => {
      mockFetch({
        localTags: tagsResponse([{ model: 'local:latest' }]),
        cloudTags: tagsResponse([{ model: 'cloud:latest' }]),
      });
      const service = buildService({
        resolveConnection: () => ({ host: LOCAL_HOST, apiKey: 'secret-key' }),
      });

      await service.getModels();
      service.createModel('cloud:latest');

      expect(createOllamaMock).toHaveBeenCalledWith({
        baseURL: OLLAMA_CLOUD_HOST,
        headers: { Authorization: 'Bearer secret-key' },
      });
    });

    it('routes a local model at the configured host', async () => {
      mockFetch({ localTags: tagsResponse([{ model: 'local:latest' }]) });
      const service = buildService();

      await service.getModels();
      service.createModel('local:latest');

      expect(createOllamaMock).toHaveBeenCalledWith({
        baseURL: LOCAL_HOST,
        headers: undefined,
      });
    });

    it('caches one provider client per host and API key', () => {
      const connection: { host: string; apiKey?: string } = { host: LOCAL_HOST };
      const service = buildService({ resolveConnection: () => connection });

      service.createModel('first:latest');
      service.createModel('second:latest');
      connection.apiKey = 'new-key';
      service.createModel('third:latest');

      expect(createOllamaMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('lifecycle', () => {
    it('does nothing at boot without a refresh interval', async () => {
      const fetchMock = mockFetch({ localTags: tagsResponse([]) });
      const service = buildService();

      service.onModuleInit();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('warms the catalog at boot and refreshes it on the interval', async () => {
      vi.useFakeTimers();
      const fetchMock = mockFetch({ localTags: tagsResponse([{ model: 'local:latest' }]) });
      const service = buildService({ refreshIntervalMs: 1_000, modelsCacheTtlMs: -1 });
      const tagFetches = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/tags')).length;

      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(tagFetches()).toBe(1);

      await vi.advanceTimersByTimeAsync(1_000);
      expect(tagFetches()).toBe(2);

      service.onModuleDestroy();
    });

    it('stops refreshing after module destroy', async () => {
      vi.useFakeTimers();
      const fetchMock = mockFetch({ localTags: tagsResponse([]) });
      const service = buildService({ refreshIntervalMs: 1_000, modelsCacheTtlMs: -1 });
      const tagFetches = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/tags')).length;

      service.onModuleInit();
      await vi.advanceTimersByTimeAsync(0);
      service.onModuleDestroy();
      const callsAtDestroy = tagFetches();

      await vi.advanceTimersByTimeAsync(5_000);

      expect(tagFetches()).toBe(callsAtDestroy);
    });
  });
});
