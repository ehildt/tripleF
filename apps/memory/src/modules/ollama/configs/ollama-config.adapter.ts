import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { getNumberEnv } from '@triplef/helpers/get-number-env';

import type { OllamaConnectionConfig } from './ollama-config.types.js';

export function OllamaConfigAdapter(
  env = process.env,
): OllamaConnectionConfig & {
  keepAlive: string;
  streamChunkTimeoutMs: number;
  streamTotalTimeoutMs: number;
  generateTotalTimeoutMs: number;
  enableSmoothStream: boolean;
} {
  return {
    host: env.OLLAMA_HOST ?? 'http://127.0.0.1:11434/api',
    // The API key is needed for remote Ollama servers (e.g., Ollama Cloud).
    // Local self-hosted Ollama typically doesn't require authentication.
    apiKey: env.OLLAMA_API_KEY || undefined,
    keepAlive: env.OLLAMA_KEEP_ALIVE ?? '5m',
    streamChunkTimeoutMs: getNumberEnv(
      env.OLLAMA_STREAM_CHUNK_TIMEOUT_MS,
      60_000,
    ) as number,
    streamTotalTimeoutMs: getNumberEnv(
      env.OLLAMA_STREAM_TOTAL_TIMEOUT_MS,
      600_000,
    ) as number,
    generateTotalTimeoutMs: getNumberEnv(
      env.OLLAMA_GENERATE_TOTAL_TIMEOUT_MS,
      300_000,
    ) as number,
    enableSmoothStream: getBooleanEnv(env.OLLAMA_ENABLE_SMOOTH_STREAM, true)!,
  };
}
