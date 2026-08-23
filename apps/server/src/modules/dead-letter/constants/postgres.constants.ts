export const POSTGRES_CONFIG = Symbol('POSTGRES_CONFIG');

export const DLQ_STATUSES = ['Failed', 'Active', 'Cleared', 'Removed'] as const;
