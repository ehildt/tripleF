import { OllamaService } from '@ehildt/nestjs-ollama';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { OllamaModelsService } from './ollama-models.service.js';

describe('OllamaModelsService', () => {
  let service: OllamaModelsService;
  let ollamaService: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaModelsService,
        {
          provide: OllamaService,
          useValue: {
            list: vi.fn().mockResolvedValue(['llama3.2-vision', 'minicpm']),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaModelsService>(OllamaModelsService);
    ollamaService = module.get<OllamaService>(OllamaService);
  });

  describe('getModels', () => {
    it('should return list of models from ollama service', async () => {
      const models = await service.getModels();

      expect(ollamaService.list).toHaveBeenCalled();
      expect(models).toEqual(['llama3.2-vision', 'minicpm']);
    });

    it('should handle empty model list', async () => {
      (ollamaService.list as any).mockResolvedValueOnce([]);

      const models = await service.getModels();

      expect(models).toEqual([]);
    });

    it('should propagate errors from ollama service', async () => {
      (ollamaService.list as any).mockRejectedValueOnce(
        new Error('Connection failed'),
      );

      await expect(service.getModels()).rejects.toThrow('Connection failed');
    });
  });
});
