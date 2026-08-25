/**
 * pino `redact` paths shared by the core and BullMQ logger config adapters.
 * Each secret-shaped key is listed bare (top-level) and `*.`-prefixed (one
 * level deep); the `req.headers.*` entries cover request-shaped objects.
 */
const SECRET_KEYS = [
  'apiKey',
  'api_key',
  'api-key',
  'secret',
  'token',
  'authorization',
  'password',
  'cookie',
  'accessToken',
  'refreshToken',
];

export const REDACT_PATHS: string[] = [
  ...SECRET_KEYS,
  ...SECRET_KEYS.map((key) => `*.${key}`),
  'req.headers.authorization',
  'req.headers.cookie',
];

export const REDACT_CENSOR = '[REDACTED]';
