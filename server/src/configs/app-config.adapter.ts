import { AppConfig } from '@ehildt/ckir-helpers/bootstrap';
import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import { getByteSizeEnv } from '@ehildt/ckir-helpers/get-byte-size-env';
import { getNumberEnv } from '@ehildt/ckir-helpers/get-number-env';
import { LogLevel } from '@nestjs/common';

export function AppConfigAdapter(env = process.env): AppConfig {
  return {
    address: env.ADDRESS ?? '0.0.0.0',
    nodeEnv: env.NODE_ENV ?? 'development',
    port: Number(getNumberEnv(env.PORT)),
    bodyLimit: Number(getNumberEnv(env.BODY_LIMIT)),
    printConfig: getBooleanEnv(env.PRINT_CONFIG) ?? false,
    enableSwagger: getBooleanEnv(env.ENABLE_SWAGGER) ?? false,
    logLevel: (env.LOG_LEVEL?.split(',')?.filter(Boolean) ??
      []) as Array<LogLevel>,
    health: {
      memoryHeap: getByteSizeEnv(
        process.env.HEALTH_MEMORY_HEAP,
        256 * 1024 * 1024,
      )!,
      memoryRSS: getByteSizeEnv(
        process.env.HEALTH_MEMORY_RSS,
        256 * 1024 * 1024,
      )!,
      diskPath: env.HEALTH_DISK_PATH ?? '/',
      diskThresholdPercent:
        (getNumberEnv(env.HEALTH_DISK_THRESHOLD) as number) ?? 0.8,
    },
    cors: env.CORS_ORIGIN
      ? {
          origin: env.CORS_ORIGIN,
          methods: env.CORS_METHODS,
          preflightContinue:
            getBooleanEnv(env.CORS_PREFLIGHT_CONTINUE) ?? false,
          optionsSuccessStatus: Number(
            getNumberEnv(env.CORS_OPTIONS_SUCCESS_STATUS),
          ),
          credentials: getBooleanEnv(env.CORS_CREDENTIALS) ?? false,
          allowedHeaders: 'Content-Type,Accept,X-Vision-LLM',
        }
      : undefined,
  };
}
