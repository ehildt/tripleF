import { Test } from '@nestjs/testing';

import { OLLAMA_API_CONFIG } from './ollama-api.constants.ts';
import { OllamaApiConfig } from './ollama-api.model.ts';
import { OllamaApiModule } from './ollama-api.module.ts';
import { OllamaApiService } from './ollama-api.service.ts';

describe('OllamaApiModule', () => {
  const mockConfig: OllamaApiConfig = {
    resolveConnection: () => ({ host: 'http://127.0.0.1:11434/api', apiKey: undefined }),
  };

  describe('registerAsync', () => {
    it('should return dynamic module configuration', () => {
      const result = OllamaApiModule.registerAsync({
        useFactory: async () => mockConfig,
      });

      expect(result.module).toBe(OllamaApiModule);
      expect(result.providers).toContain(OllamaApiService);
      expect(result.providers?.some((p: any) => p?.provide === OLLAMA_API_CONFIG)).toBe(true);
    });

    it('should handle global option', () => {
      const result = OllamaApiModule.registerAsync({
        global: true,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(true);
    });

    it('should handle non-global option', () => {
      const result = OllamaApiModule.registerAsync({
        global: false,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(false);
    });

    it('should pass injected dependencies to useFactory', () => {
      const result = OllamaApiModule.registerAsync({
        inject: ['DEPENDENCY'],
        useFactory: (dep: { host: string }) => ({
          resolveConnection: () => ({ host: dep.host }),
        }),
      });

      const configProvider = result.providers?.find((p: any) => p?.provide === OLLAMA_API_CONFIG) as any;
      expect(configProvider).toBeDefined();
      expect(configProvider?.inject).toContain('DEPENDENCY');
    });
  });

  describe('integration', () => {
    it('should provide services when registered', async () => {
      const app = await Test.createTestingModule({
        imports: [
          OllamaApiModule.registerAsync({
            useFactory: () => mockConfig,
          }),
        ],
      }).compile();

      const service = app.get<OllamaApiService>(OllamaApiService);
      expect(service).toBeDefined();
      await app.close();
    });
  });
});
