import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { OllamaConfigService } from '../configs/ollama-config.service.js';

import { OllamaModelsService } from './ollama-models.service.js';

describe('OllamaModelsService', () => {
  let service: OllamaModelsService;

  beforeEach(async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const endpoint = String(url);
      if (endpoint.endsWith('/api/tags')) {
        return {
          ok: true,
          json: async () => ({
            models: [
              {
                name: 'llama3.2-vision',
                model: 'llama3.2-vision:latest',
                details: {
                  parameter_size: '3B',
                  quantization_level: 'Q4_0',
                  family: 'llama',
                },
              },
              {
                name: 'minicpm',
                model: 'minicpm:latest',
                details: {
                  parameter_size: '2B',
                  quantization_level: 'Q4_0',
                  family: 'minicpm',
                },
              },
            ],
          }),
        } as Response;
      }

      const body =
        init && typeof init.body === 'string' ? JSON.parse(init.body) : {};
      if (body.name === 'llama3.2-vision:latest') {
        return {
          ok: true,
          json: async () => ({
            capabilities: ['vision'],
            model_info: { 'some.context_length': 4096 },
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({
          capabilities: ['completion'],
          model_info: { 'some.context_length': 2048 },
        }),
      } as Response;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaModelsService,
        {
          provide: OllamaConfigService,
          useValue: {
            config: {
              host: '127.0.0.1',
              headers: undefined,
            },
          },
        },
      ],
    }).compile();

    service = module.get<OllamaModelsService>(OllamaModelsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getModels', () => {
    it('should return list of models from ollama api', async () => {
      const models = await service.getModels();

      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1/api/tags', {
        headers: undefined,
      });
      expect(models).toEqual({
        models: [
          {
            model: 'llama3.2-vision:latest',
            parameter_size: '3B',
            quantization_level: 'Q4_0',
            family: 'llama',
            capabilities: ['vision'],
            context_length: 4096,
          },
          {
            model: 'minicpm:latest',
            parameter_size: '2B',
            quantization_level: 'Q4_0',
            family: 'minicpm',
            capabilities: ['completion'],
            context_length: 2048,
          },
        ],
      });
    });

    it('should handle empty model list', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      } as Response);

      const models = await service.getModels();

      expect(models).toEqual({ models: [] });
    });

    it('should propagate errors from ollama api', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      await expect(service.getModels()).rejects.toThrow('Connection failed');
    });
  });

  describe('supportsCapability', () => {
    it('returns true when the model reports the capability', async () => {
      await expect(
        service.supportsCapability('llama3.2-vision:latest', 'vision'),
      ).resolves.toBe(true);
    });

    it('returns false when the model does not report the capability', async () => {
      await expect(
        service.supportsCapability('minicpm:latest', 'vision'),
      ).resolves.toBe(false);
    });

    it('returns false when the model is unknown', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const endpoint = String(url);
        if (endpoint.endsWith('/api/tags')) {
          return {
            ok: true,
            json: async () => ({ models: [] }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      await expect(
        service.supportsCapability('unknown:latest', 'vision'),
      ).resolves.toBe(false);
    });
  });
});
