import {
  DEFAULT_TOAST_TYPE_FILTERS,
  TOAST_TYPES,
} from '../toast-settings.constant';
import type { ToastTypeFilters } from '../toast-settings.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Merge known boolean filter values into fresh defaults, ignoring every invalid field. */
export function parseToastTypeFilters(saved: string | null): ToastTypeFilters {
  const filters = { ...DEFAULT_TOAST_TYPE_FILTERS };
  if (saved === null) return filters;
  try {
    const parsed = asRecord(JSON.parse(saved) as unknown);
    if (!parsed) return filters;
    for (const type of TOAST_TYPES) {
      const enabled = parsed[type];
      if (typeof enabled === 'boolean') filters[type] = enabled;
    }
    return filters;
  } catch {
    return filters;
  }
}
