import { Test } from '@nestjs/testing';

import { AI_SDK_CONFIG } from './ai-sdk.constants.ts';
import { AiSdkConfig } from './ai-sdk.model.ts';
import { AiSdkModule } from './ai-sdk.module.ts';
import { AiSdkService } from './ai-sdk.service.ts';

describe('AiSdkModule', () => {
  const mockConfig: AiSdkConfig = {
    streamChunkTimeoutMs: 60_000,
    streamTotalTimeoutMs: 600_000,
    generateTotalTimeoutMs: 300_000,
    enableSmoothStream: true,
    createModel: (modelName: string) => ({ modelName }) as any,
  };

  describe('registerAsync', () => {
    it('should return dynamic module configuration', () => {
      const result = AiSdkModule.registerAsync({
        useFactory: async () => mockConfig,
      });

      expect(result.module).toBe(AiSdkModule);
      expect(result.providers).toContain(AiSdkService);
      expect(result.providers?.some((p: any) => p?.provide === AI_SDK_CONFIG)).toBe(true);
    });

    it('should handle global option', () => {
      const result = AiSdkModule.registerAsync({
        global: true,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(true);
    });

    it('should handle non-global option', () => {
      const result = AiSdkModule.registerAsync({
        global: false,
        useFactory: async () => mockConfig,
      });

      expect(result.global).toBe(false);
    });

    it('should pass injected dependencies to useFactory', () => {
      const result = AiSdkModule.registerAsync({
        inject: ['DEPENDENCY'],
        useFactory: (dep: { model: string }) => ({
          ...mockConfig,
          createModel: () => ({ modelName: dep.model }) as any,
        }),
      });

      const configProvider = result.providers?.find((p: any) => p?.provide === AI_SDK_CONFIG) as any;
      expect(configProvider).toBeDefined();
      expect(configProvider?.inject).toContain('DEPENDENCY');
    });
  });

  describe('integration', () => {
    it('should provide services when registered', async () => {
      const app = await Test.createTestingModule({
        imports: [
          AiSdkModule.registerAsync({
            useFactory: () => mockConfig,
          }),
        ],
      }).compile();

      const service = app.get<AiSdkService>(AiSdkService);
      expect(service).toBeDefined();
      await app.close();
    });
  });
});
