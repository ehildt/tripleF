import type { HealthTileViewModel } from '../health-tile-view-model.model';

/** Build an error-state tile for a tracked key. */
export function mapErrorTile(key: string): HealthTileViewModel {
  return { key, status: 'unknown', loading: false, error: true };
}
