import type { HealthTileViewModel } from '../types/health-tile-view-model.type';

/** Build a loading-state tile for a tracked key. */
export function mapLoadingTile(key: string): HealthTileViewModel {
  return { key, status: 'loading', loading: true, error: false };
}
