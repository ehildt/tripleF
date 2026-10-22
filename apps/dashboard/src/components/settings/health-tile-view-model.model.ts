export interface HealthTileViewModel {
  /** The tile's identifier (also the health-check name it renders). */
  key: string;
  /** The tile's health status ('healthy' | 'error' | …, per health check). */
  status: string;
  /** Whether the health check behind this tile is still loading. */
  loading: boolean;
  /** Whether the health check behind this tile failed. */
  error: boolean;
}
