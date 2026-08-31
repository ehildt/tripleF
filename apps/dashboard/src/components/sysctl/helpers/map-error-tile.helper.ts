import type { HealthTileViewModel } from '../types/health-tile-view-model.type';

/** Build an error-state tile for a tracked key. */
export function mapErrorTile(key: string): HealthTileViewModel {
  return { key, status: 'unknown', loading: false, error: true };
}
