import type { HealthTileViewModel } from '../health-tile-view-model.model';

export interface SystemHealthSectionProps {
  /** The health tiles to render (view models built upstream in settings). */
  tiles: HealthTileViewModel[];
}
