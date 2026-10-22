import type { HealthTileViewModel } from '../health-tile-view-model.model';

export interface SystemSectionProps {
  /** The health tiles shown at the top of the System tab. */
  tiles: HealthTileViewModel[];
}
