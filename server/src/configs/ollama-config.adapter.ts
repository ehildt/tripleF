import { Config } from 'ollama';

import { SYSTEM_PROMPTS } from '../constants/prompt.constants.js';

export interface OllamaSystemPrompts {
  DESCRIBE: string;
  COMPARE: string;
  OCR: string;
}

export function OllamaConfigAdapter(
  env = process.env,
): Config & { keepAlive: string; systemPrompts: OllamaSystemPrompts } {
  const config: Config & {
    keepAlive: string;
    systemPrompts: OllamaSystemPrompts;
  } = {
    host: env.OLLAMA_HOST ?? '127.0.0.1',
    keepAlive: env.OLLAMA_KEEP_ALIVE ?? '5m',
    systemPrompts: {
      DESCRIBE: env.OLLAMA_SYSTEM_PROMPT_DESCRIBE ?? SYSTEM_PROMPTS.DESCRIBE,
      COMPARE: env.OLLAMA_SYSTEM_PROMPT_COMPARE ?? SYSTEM_PROMPTS.COMPARE,
      OCR: env.OLLAMA_SYSTEM_PROMPT_OCR ?? SYSTEM_PROMPTS.OCR,
    },
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
