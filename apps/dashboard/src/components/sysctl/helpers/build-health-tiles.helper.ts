import type { HealthResponse } from '@/api/queries/use-health-ready.query.type';

import type { HealthTileViewModel } from '../types/health-tile-view-model.type';
import { mapErrorTile } from './map-error-tile.helper';
import { mapHealthTile } from './map-health-tile.helper';
import { mapLoadingTile } from './map-loading-tile.helper';

/**
 * Map the terminus health response to the tile view models. When any
 * indicator is down the endpoint answers 503 and moves the failed entries
 * from `info` into `error`, while `details` keeps one entry per indicator.
 * The tiles must show down checks as down, so keys are taken from the union
 * of all three buckets — never from `info` alone, or failed checks would
 * silently disappear from the dashboard.
 */
export function buildHealthTiles(
  data: HealthResponse | undefined,
  loading: boolean,
  queryError: boolean,
  trackedKeys: readonly string[],
): HealthTileViewModel[] {
  if (loading) {
    return trackedKeys.map(mapLoadingTile);
  }
  if (queryError) {
    return trackedKeys.map(mapErrorTile);
  }
  if (!data) return [];

  const info = data.info ?? {};
  const details = data.details ?? {};
  const errors = data.error ?? {};
  const keys = new Set([
    ...Object.keys(details),
    ...Object.keys(info),
    ...Object.keys(errors),
  ]);

  return [...keys].map((key) => mapHealthTile(key, details, info, errors));
}
