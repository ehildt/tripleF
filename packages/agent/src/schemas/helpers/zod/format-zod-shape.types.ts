export interface FormatZodShapeOptions {
  /**
   * Top-level field overrides: replace a field's derived type hint with a
   * custom one. Used for vocabularies the prompt supplies elsewhere (e.g.
   * the enabled tool catalog), so the shape stays a placeholder instead of
   * repeating the full enum.
   */
  overrides?: Record<string, string>;
}
