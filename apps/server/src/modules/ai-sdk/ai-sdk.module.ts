import { Global, Module } from '@nestjs/common';
import { AiSdkModule as AiSdkCoreModule } from '@triplef/ai-sdk';
import { createOllama } from 'ollama-ai-provider-v2';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { OLLAMA_CLOUD_HOST } from './constants/ollama-cloud.constants.js';
import { OllamaOverridesController } from './controllers/ollama-overrides.controller.js';
import { buildOllamaHeaders } from './helpers/build-ollama-headers.helper.js';
import { ModelWarmupService } from './services/model-warmup.service.js';
import { OllamaModelsService } from './services/ollama-models.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * App-side AI SDK wiring: registers the shared `@triplef/ai-sdk` client
 * with the app's Ollama provider (env defaults + SysCtl overrides) and
 * keeps the app-specific services (model catalog, overrides, warm-up).
 */
@Global()
@Module({
  imports: [
    AiSdkCoreModule.registerAsync({
      global: true,
      inject: [
        OllamaConfigService,
        OllamaOverridesService,
        OllamaModelsService,
      ],
      useFactory: (
        cfg: OllamaConfigService,
        overrides: OllamaOverridesService,
        models: OllamaModelsService,
      ) => {
        const clients = new Map<string, ReturnType<typeof createOllama>>();
        return {
          streamChunkTimeoutMs: cfg.config.streamChunkTimeoutMs,
          streamTotalTimeoutMs: cfg.config.streamTotalTimeoutMs,
          generateTotalTimeoutMs: cfg.config.generateTotalTimeoutMs,
          enableSmoothStream: cfg.config.enableSmoothStream,
          createModel: (name: string) => {
            const { host, apiKey } = overrides.getConfig();
            const baseURL =
              models.getModelOrigin(name) === 'cloud'
                ? OLLAMA_CLOUD_HOST
                : host;
            const fingerprint = `${baseURL}|${apiKey ?? ''}`;
            let client = clients.get(fingerprint);
            if (!client) {
              client = createOllama({
                baseURL,
                headers: buildOllamaHeaders(apiKey),
              });
              clients.set(fingerprint, client);
            }
            return client(name);
          },
        };
      },
    }),
  ],
  controllers: [OllamaOverridesController],
  providers: [
    OllamaConfigService,
    OllamaOverridesService,
    OllamaModelsService,
    ModelWarmupService,
  ],
  exports: [
    OllamaConfigService,
    OllamaOverridesService,
    OllamaModelsService,
    ModelWarmupService,
  ],
})
export class AiSdkModule {}
