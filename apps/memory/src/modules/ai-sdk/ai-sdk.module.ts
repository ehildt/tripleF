import { Global, Module } from '@nestjs/common';
import { AiSdkModule as AiSdkCoreModule } from '@triplef/ai-sdk';
import { createOllama } from 'ollama-ai-provider-v2';

import { OllamaConfigService } from './configs/ollama-config.service.js';
import { OLLAMA_CLOUD_HOST } from './constants/ollama-cloud.constants.js';
import { buildOllamaHeaders } from './helpers/build-ollama-headers.helper.js';
import { OllamaModelsService } from './services/ollama-models.service.js';
import { OllamaOverridesService } from './services/ollama-overrides.service.js';

/**
 * Slim ai-sdk surface for the memory app: registers the shared
 * `@triplef/ai-sdk` client with the app's Ollama provider and keeps the
 * app-specific services (model catalog, overrides). The chat-facing
 * harness services (tool selection, streaming) stay in the main server.
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
  providers: [OllamaConfigService, OllamaOverridesService, OllamaModelsService],
  exports: [OllamaConfigService, OllamaOverridesService, OllamaModelsService],
})
export class AiSdkModule {}
