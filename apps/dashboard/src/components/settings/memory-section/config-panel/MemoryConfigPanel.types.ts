/**
 * The configuration groups shown one at a time in the Settings → Memory tab;
 * the submenu icon selects which group the panel renders.
 */
export type MemoryGroupId =
  | 'spaces'
  | 'episodeProbe'
  | 'cognitionProfile'
  | 'constellationDiagram'
  | 'maintenanceModels'
  | 'autoTriggers'
  | 'sweepLimits'
  | 'research';

export interface MemoryConfigPanelProps {
  /** Which configuration group is currently visible. */
  activeGroup: MemoryGroupId;
}
