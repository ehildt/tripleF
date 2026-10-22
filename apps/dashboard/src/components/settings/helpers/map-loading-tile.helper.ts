import type { HealthTileViewModel } from '../health-tile-view-model.model';

/** Build a loading-state tile for a tracked key. */
export function mapLoadingTile(key: string): HealthTileViewModel {
  return { key, status: 'loading', loading: true, error: false };
}
