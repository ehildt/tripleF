export const POSTGRES_CONFIG = Symbol('POSTGRES_CONFIG');

export const DLQ_STATUSES = [
  'PENDING_RETRY',
  'REINSERTED',
  'ARCHIVED',
] as const;
