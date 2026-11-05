import { describe, expect, it } from 'vitest';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';

describe('OllamaConfigAdapter', () => {
  it('falls back to a local host and no API key', () => {
    const config = OllamaConfigAdapter({});

    expect(config).toMatchObject({
      host: 'http://127.0.0.1:11434/api',
      apiKey: undefined,
      keepAlive: '5m',
      streamChunkTimeoutMs: 60_000,
      streamTotalTimeoutMs: 600_000,
      generateTotalTimeoutMs: 300_000,
      enableSmoothStream: true,
    });
  });

  it('reads the configured host, key and keep-alive', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_HOST: 'https://ollama.com/api',
      OLLAMA_API_KEY: 'secret-key',
      OLLAMA_KEEP_ALIVE: '30m',
    });

    expect(config).toMatchObject({
      host: 'https://ollama.com/api',
      apiKey: 'secret-key',
      keepAlive: '30m',
    });
  });

  it('treats an empty API key as unset', () => {
    expect(OllamaConfigAdapter({ OLLAMA_API_KEY: '' }).apiKey).toBeUndefined();
  });

  it('overrides the timeouts from the environment', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_STREAM_CHUNK_TIMEOUT_MS: '1000',
      OLLAMA_STREAM_TOTAL_TIMEOUT_MS: '2000',
      OLLAMA_GENERATE_TOTAL_TIMEOUT_MS: '3000',
    });

    expect(config).toMatchObject({
      streamChunkTimeoutMs: 1000,
      streamTotalTimeoutMs: 2000,
      generateTotalTimeoutMs: 3000,
    });
  });

  it('lets the environment disable smooth streaming', () => {
    expect(
      OllamaConfigAdapter({ OLLAMA_ENABLE_SMOOTH_STREAM: 'false' })
        .enableSmoothStream,
    ).toBe(false);
  });
});
