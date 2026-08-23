export interface ParsedFailureReason {
  /**
   * Human-readable message — the only thing list rows should ever show.
   * Never contains raw JSON.
   */
  text: string;
  /** Pretty-printed JSON when the reason was a complex object, else null. */
  raw: string | null;
}
