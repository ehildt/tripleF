import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';
import { OllamaConfigService } from './ollama-config.service.js';

describe('OllamaConfigAdapter', () => {
  it('returns expected config from env object', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_HOST: 'localhost',
      OLLAMA_KEEP_ALIVE: '10m',
    });

    expect(config).toEqual({
      host: 'localhost',
      apiKey: undefined,
      keepAlive: '10m',
      streamChunkTimeoutMs: 60000,
      streamTotalTimeoutMs: 600000,
      generateTotalTimeoutMs: 300000,
      enableSmoothStream: true,
    });
  });

  it('uses default values when env vars are not provided', () => {
    const config = OllamaConfigAdapter({});

    expect(config.host).toBe('http://127.0.0.1:11434/api');
    expect(config.keepAlive).toBe('5m');
  });

  it('exposes the API key when OLLAMA_API_KEY is provided', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_API_KEY: 'test-api-key',
    });

    expect(config.apiKey).toBe('test-api-key');
  });

  it('exposes no API key when OLLAMA_API_KEY is not provided', () => {
    const config = OllamaConfigAdapter({});

    expect(config.apiKey).toBeUndefined();
  });

  it('exposes no API key when OLLAMA_API_KEY is empty string', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_API_KEY: '',
    });

    expect(config.apiKey).toBeUndefined();
  });
});

describe('OllamaConfigService', () => {
  let service: OllamaConfigService;

  beforeEach(() => {
    vi.stubEnv('OLLAMA_HOST', 'test-host');
    vi.stubEnv('OLLAMA_KEEP_ALIVE', '2m');
    service = new OllamaConfigService();
  });

  it('returns config from adapter', () => {
    const config = service.config;

    expect(config.host).toBe('test-host');
    expect(config.keepAlive).toBe('2m');
  });
});
