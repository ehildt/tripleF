import { LogLevel } from '@nestjs/common';

export const API_DOCS = 'api-docs';
export const API_DOCS_JSON = 'api-docs-json';

export const DEFAULT_BODY_LIMIT = 16777216;
export const DEFAULT_LOG_LEVELS: Array<LogLevel> = ['warn', 'error', 'debug', 'log', 'verbose', 'fatal'];

export const getBodyLimit = (value?: string | null): number => {
  if (value == null) return DEFAULT_BODY_LIMIT;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? DEFAULT_BODY_LIMIT : parsed;
};

export const getLogLevel = (value?: string): Array<LogLevel> => {
  if (!value) return DEFAULT_LOG_LEVELS;
  return value.split(',').filter(Boolean) as Array<LogLevel>;
};
