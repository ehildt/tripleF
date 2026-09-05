import type { HealthCheckDetails } from '@/api/queries/use-health-ready.query.type';

import type { HealthTileViewModel } from '../types/health-tile-view-model.type';

/** Build a tile from the health buckets for one key. */
export function mapHealthTile(
  key: string,
  details: HealthCheckDetails,
  info: HealthCheckDetails,
  errors: HealthCheckDetails,
): HealthTileViewModel {
  const status =
    details[key]?.status ??
    info[key]?.status ??
    errors[key]?.status ??
    'unknown';
  return { key, status, loading: false, error: key in errors };
}
