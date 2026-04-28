import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OllamaConfigAdapter } from './ollama-config.adapter.js';
import { OllamaConfigService } from './ollama-config.service.js';

describe('OllamaConfigAdapter', () => {
  it('returns expected config from env object', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_HOST: 'localhost',
      OLLAMA_KEEP_ALIVE: '10m',
      OLLAMA_SYSTEM_PROMPT_DESCRIBE: 'Custom describe prompt',
      OLLAMA_SYSTEM_PROMPT_COMPARE: 'Custom compare prompt',
      OLLAMA_SYSTEM_PROMPT_OCR: 'Custom OCR prompt',
    });

    expect(config).toEqual({
      host: 'localhost',
      keepAlive: '10m',
      systemPrompts: {
        DESCRIBE: 'Custom describe prompt',
        COMPARE: 'Custom compare prompt',
        OCR: 'Custom OCR prompt',
      },
    });
  });

  it('uses default values when env vars are not provided', () => {
    const config = OllamaConfigAdapter({});

    expect(config.host).toBe('127.0.0.1');
    expect(config.keepAlive).toBe('5m');
  });

  it('adds Authorization header when OLLAMA_API_KEY is provided', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_API_KEY: 'test-api-key',
    });

    expect(config.headers).toEqual({
      Authorization: 'Bearer test-api-key',
    });
  });

  it('does not add Authorization header when OLLAMA_API_KEY is not provided', () => {
    const config = OllamaConfigAdapter({});

    expect(config.headers).toBeUndefined();
  });

  it('does not add Authorization header when OLLAMA_API_KEY is empty string', () => {
    const config = OllamaConfigAdapter({
      OLLAMA_API_KEY: '',
    });

    expect(config.headers).toBeUndefined();
  });
});

describe('OllamaConfigService', () => {
  let service: OllamaConfigService;

  beforeEach(() => {
    vi.stubEnv('OLLAMA_HOST', 'test-host');
    vi.stubEnv('OLLAMA_KEEP_ALIVE', '2m');
    vi.stubEnv('OLLAMA_SYSTEM_PROMPT_DESCRIBE', 'Test describe');
    service = new OllamaConfigService();
  });

  it('returns config from adapter', () => {
    const config = service.config;

    expect(config.host).toBe('test-host');
    expect(config.keepAlive).toBe('2m');
    expect(config.systemPrompts.DESCRIBE).toBe('Test describe');
  });
});
