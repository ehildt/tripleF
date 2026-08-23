import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';

export interface MemoryClientConfig {
  /** Base URL of the memory app (the outsourced qdrant service). */
  url: string;
  /** Feature flag — mirrors the old MEMORY_ENABLED gate. */
  enabled: boolean;
}

export function MemoryClientConfigAdapter(
  env = process.env,
): MemoryClientConfig {
  return {
    url: env.MEMORY_URL ?? 'http://localhost:3400',
    enabled: getBooleanEnv(env.MEMORY_ENABLED, false)!,
  };
}
