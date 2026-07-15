interface OllamaClientConfig {
  host?: string;
  headers?: Record<string, string>;
}

export interface OllamaSystemPrompts {
  DESCRIBE: string;
  COMPARE: string;
  OCR: string;
}

export interface OllamaDeveloperPrompts {
  IMAGE_CONSTRAINT: string;
  TEXT_CONSTRAINT: string;
}

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

export function OllamaConfigAdapter(env = process.env): OllamaClientConfig & {
  keepAlive: string;
  systemPrompts: OllamaSystemPrompts;
  developerPrompts: OllamaDeveloperPrompts;
  streamChunkTimeoutMs: number;
  streamTotalTimeoutMs: number;
  generateTotalTimeoutMs: number;
  enableSmoothStream: boolean;
} {
  const config: OllamaClientConfig & {
    keepAlive: string;
    systemPrompts: OllamaSystemPrompts;
    developerPrompts: OllamaDeveloperPrompts;
    streamChunkTimeoutMs: number;
    streamTotalTimeoutMs: number;
    generateTotalTimeoutMs: number;
    enableSmoothStream: boolean;
  } = {
    host: env.OLLAMA_HOST ?? 'http://127.0.0.1:11434/api',
    keepAlive: env.OLLAMA_KEEP_ALIVE ?? '5m',
    systemPrompts: {
      DESCRIBE: env.OLLAMA_SYSTEM_PROMPT_DESCRIBE ?? '',
      COMPARE: env.OLLAMA_SYSTEM_PROMPT_COMPARE ?? '',
      OCR: env.OLLAMA_SYSTEM_PROMPT_OCR ?? '',
    },
    developerPrompts: {
      IMAGE_CONSTRAINT: env.OLLAMA_DEVELOPER_PROMPT_IMAGE_CONSTRAINT ?? '',
      TEXT_CONSTRAINT: env.OLLAMA_DEVELOPER_PROMPT_TEXT_CONSTRAINT ?? '',
    },
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

  // Only add Authorization header if API key is provided
  // This is needed for remote Ollama servers (e.g., Ollama Cloud)
  // Local self-hosted Ollama typically doesn't require authentication
  if (env.OLLAMA_API_KEY) {
    config.headers = {
      Authorization: `Bearer ${env.OLLAMA_API_KEY}`,
    };
  }

  return config;
}
