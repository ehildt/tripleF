import type { OllamaConnectionConfig } from './ollama-config.types.js';

function parseIntWithDefault(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBoolWithDefault(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (!value) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

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
    streamChunkTimeoutMs: parseIntWithDefault(
      env.OLLAMA_STREAM_CHUNK_TIMEOUT_MS,
      60_000,
    ),
    streamTotalTimeoutMs: parseIntWithDefault(
      env.OLLAMA_STREAM_TOTAL_TIMEOUT_MS,
      600_000,
    ),
    generateTotalTimeoutMs: parseIntWithDefault(
      env.OLLAMA_GENERATE_TOTAL_TIMEOUT_MS,
      300_000,
    ),
    enableSmoothStream: parseBoolWithDefault(
      env.OLLAMA_ENABLE_SMOOTH_STREAM,
      true,
    ),
  };
}
