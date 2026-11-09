export interface PreprocessingSettingsSync {
  /** Load global and session settings once without echoing hydration into saves. */
  loadSettings: () => Promise<void>;
  /** Persist the latest settings immediately and wait for the controlling global write. */
  flushSettings: () => Promise<void>;
}
