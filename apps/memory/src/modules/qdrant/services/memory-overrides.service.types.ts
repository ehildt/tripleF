export interface MemoryOverridesPatch {
  /**
   * Cognition profile character cap (serialized JSON size). Number sets the
   * override; null clears it (back to the env baseline). Clamped 500–32000.
   */
  cognitionLimit?: number | null;
}
